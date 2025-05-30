document.addEventListener("DOMContentLoaded", function() {
    const toggleSidebarButton = document.getElementById('toggleSidebar');
    const closeSidebarButton = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    toggleSidebarButton.addEventListener('click', () => {
        sidebar.classList.add('sidebar-open');
    });

    closeSidebarButton.addEventListener('click', () => {
        sidebar.classList.remove('sidebar-open');
    });
});
