export function openInstallation(event) {
 if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 window.Site.go('installation');
}
