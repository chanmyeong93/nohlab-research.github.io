/* ==========================================================================
   js/news-admin.js - News Admin (SHA-256 해시 검증 + 이미지 초기화 + i18n)
   비밀번호 원문은 코드에 저장하지 않고 SHA-256 해시만 비교합니다.
   비밀번호를 바꾸려면: 브라우저 콘솔에서
     crypto.subtle.digest('SHA-256', new TextEncoder().encode('새비밀번호'))
       .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('')))
   로 해시를 구해 아래 ADMIN_PASSWORD_HASH 값을 교체하세요.
   ========================================================================== */
const ADMIN_PASSWORD_HASH = "5a59761489981b1b7568474acc81cce5aad0ea337fcf457b058242c71943b526";

// 비밀번호 SHA-256 해시 변환 함수
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function isAdminPassword(password) {
  if (!password || !(window.crypto && crypto.subtle)) return false;
  return (await hashPassword(password)) === ADMIN_PASSWORD_HASH;
}

document.addEventListener("DOMContentLoaded", () => {
  renderNews();

  window.addEventListener("languageChanged", () => {
    renderNews();
  });

  const modal = document.getElementById("news-modal");
  const openBtn = document.getElementById("open-write-btn");
  const closeBtn = document.getElementById("close-modal-btn");
  const closeX = document.getElementById("close-modal-x");
  const form = document.getElementById("news-form");

  // 파일 선택 취소 관련 요소
  const fileInput = document.getElementById("news-img-input");
  const clearImgBtn = document.getElementById("clear-img-btn");

  // 이미지 선택 시 취소 버튼 표시
  if (fileInput && clearImgBtn) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        clearImgBtn.style.display = "inline-block";
      } else {
        clearImgBtn.style.display = "none";
      }
    });

    // 첨부 파일 삭제(초기화) 버튼 이벤트
    clearImgBtn.addEventListener("click", () => {
      fileInput.value = ""; // 파일 선택 해제
      clearImgBtn.style.display = "none";
    });
  }

  const closeModal = () => {
    if (modal) modal.style.display = "none";
    if (form) form.reset();
    if (clearImgBtn) clearImgBtn.style.display = "none";
  };

  if (openBtn) openBtn.onclick = () => modal.style.display = "flex";
  if (closeBtn) closeBtn.onclick = closeModal;
  if (closeX) closeX.onclick = closeModal;

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const inputPass = document.getElementById("admin-pass").value;

      if (!(await isAdminPassword(inputPass))) {
        alert(getTrans("alert_pass_incorrect"));
        return;
      }

      const file = fileInput ? fileInput.files[0] : null;

      const savePost = (imgBase64) => {
        const posts = JSON.parse(localStorage.getItem("noh_news") || "[]");
        posts.unshift({
          id: Date.now(),
          title: document.getElementById("news-title").value,
          body: document.getElementById("news-body").value,
          image: imgBase64 || null,
          date: new Date().toLocaleDateString()
        });
        localStorage.setItem("noh_news", JSON.stringify(posts));
        closeModal();
        renderNews();
      };

      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => savePost(event.target.result);
        reader.readAsDataURL(file);
      } else {
        savePost(null);
      }
    };
  }
});

function renderNews() {
  const container = document.getElementById("news-container");
  if (!container) return;
  const posts = JSON.parse(localStorage.getItem("noh_news") || "[]");

  if (posts.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);" data-i18n="news_empty">${getTrans("news_empty")}</p>`;
    return;
  }

  const deleteBtnText = getTrans("news_btn_delete");

  container.innerHTML = posts.map(p => `
    <article class="news-card">
      ${p.image ? `<img src="${p.image}" class="news-img" alt="News Image">` : ''}
      <div class="news-body">
        <div class="news-meta">
          <span>${p.date}</span>
          <button onclick="deletePost(${p.id})" class="btn-del" data-i18n="news_btn_delete">${deleteBtnText}</button>
        </div>
        <h3>${p.title}</h3>
        <p>${p.body}</p>
      </div>
    </article>
  `).join("");
}

async function deletePost(id) {
  const inputPass = prompt(getTrans("prompt_delete_pass"));
  if (!inputPass) return;

  if (await isAdminPassword(inputPass)) {
    let posts = JSON.parse(localStorage.getItem("noh_news") || "[]");
    localStorage.setItem("noh_news", JSON.stringify(posts.filter(p => p.id !== id)));
    renderNews();
  } else {
    alert(getTrans("alert_pass_incorrect"));
  }
}