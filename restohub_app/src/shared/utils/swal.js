// Carga SweetAlert2 desde CDN la primera vez y lo cachea
let _swal = null;

async function loadSwal() {
  if (_swal) return _swal;
  if (window.Swal) {
    _swal = window.Swal;
    return _swal;
  }

  await new Promise((resolve, reject) => {
    // CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
    document.head.appendChild(link);

    // JS
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  _swal = window.Swal;
  return _swal;
}

// Tema RestoHub — verde oscuro / crema
const THEME = {
  customClass: {
    popup: "rh-swal-popup",
    title: "rh-swal-title",
    htmlContainer: "rh-swal-html",
    confirmButton: "rh-swal-confirm",
    cancelButton: "rh-swal-cancel",
    icon: "rh-swal-icon",
  },
  buttonsStyling: false,
};

// Inyectar estilos una sola vez
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .rh-swal-popup {
      border-radius: 20px !important;
      padding: 32px 28px !important;
      font-family: 'DM Sans', sans-serif !important;
      box-shadow: 0 24px 60px rgba(0,0,0,0.18) !important;
    }
    .rh-swal-title {
      font-family: 'Playfair Display', serif !important;
      font-size: 22px !important;
      font-weight: 700 !important;
      color: #141410 !important;
      margin-bottom: 6px !important;
    }
    .rh-swal-html {
      font-size: 14px !important;
      color: #52524A !important;
      line-height: 1.6 !important;
    }
    .rh-swal-confirm {
      background: #0A3828 !important;
      color: #fff !important;
      border: none !important;
      border-radius: 10px !important;
      padding: 12px 28px !important;
      font-family: 'DM Sans', sans-serif !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      letter-spacing: 0.06em !important;
      text-transform: uppercase !important;
      cursor: pointer !important;
      transition: background 0.2s !important;
    }
    .rh-swal-confirm:hover { background: #0F4A35 !important; }
    .rh-swal-cancel {
      background: transparent !important;
      color: #52524A !important;
      border: 1.5px solid rgba(0,0,0,0.13) !important;
      border-radius: 10px !important;
      padding: 12px 28px !important;
      font-family: 'DM Sans', sans-serif !important;
      font-weight: 600 !important;
      font-size: 13px !important;
      cursor: pointer !important;
    }
    .rh-swal-cancel:hover { background: #F5F5EC !important; }
    .swal2-icon { border: none !important; }
    .swal2-icon.swal2-success { color: #0A3828 !important; border-color: #0A3828 !important; }
    .swal2-icon.swal2-success .swal2-success-ring { border-color: rgba(10,56,40,0.2) !important; }
    .swal2-icon.swal2-success [class^=swal2-success-line] { background: #0A3828 !important; }
    .swal2-icon.swal2-warning { color: #B45309 !important; border-color: #B45309 !important; }
    .swal2-icon.swal2-error { color: #DC2626 !important; border-color: #DC2626 !important; }
    .swal2-icon.swal2-error [class^=swal2-x-mark-line] { background: #DC2626 !important; }
    .swal2-icon.swal2-question { color: #0A3828 !important; border-color: rgba(10,56,40,0.3) !important; }
    .swal2-actions { gap: 10px !important; margin-top: 20px !important; }
  `;
  document.head.appendChild(style);
}

export async function swalSuccess(title, text) {
  const Swal = await loadSwal();
  injectStyles();
  return Swal.fire({ ...THEME, icon: "success", title, text });
}

export async function swalError(title, text) {
  const Swal = await loadSwal();
  injectStyles();
  return Swal.fire({ ...THEME, icon: "error", title, text });
}

export async function swalWarning(title, text) {
  const Swal = await loadSwal();
  injectStyles();
  return Swal.fire({ ...THEME, icon: "warning", title, text });
}

export async function swalConfirm(
  title,
  text,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
) {
  const Swal = await loadSwal();
  injectStyles();
  const result = await Swal.fire({
    ...THEME,
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
}

export async function swalInfo(title, text) {
  const Swal = await loadSwal();
  injectStyles();
  return Swal.fire({ ...THEME, icon: "info", title, text });
}
