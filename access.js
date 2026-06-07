const PERMISSION_STORAGE_KEY = "mapaid-online-water-library-access";

const permissionForm = document.querySelector("#permission-form");
const permissionStatus = document.querySelector("#permission-status");

if (permissionForm && permissionStatus) {
  permissionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(permissionForm);
    const record = Object.fromEntries(formData.entries());
    window.localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(record));
    permissionStatus.textContent = "Access request saved for this browser session.";
  });
}
