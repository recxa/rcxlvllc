document.querySelectorAll('.sidebar ul li').forEach(item => {
    item.addEventListener('click', () => {
      const contentId = item.getAttribute('data-content');
      showContent(contentId);
    });
  });
  
  function showContent(contentId) {
    const viewer = document.getElementById('viewer');
    switch(contentId) {
      case 'tool1':
        viewer.innerText = 'Tool 1: A description of the tool.\n\nFeatures:\n- Feature 1\n- Feature 2';
        break;
      case 'tool2':
        viewer.innerText = 'Tool 2: Another description.\n\nDetails:\n- Usage Example\n- Tips';
        break;
      case 'about':
        viewer.innerText = 'About: Information about me.\n\nExperience:\n- Project 1\n- Project 2';
        break;
      case 'contact':
        viewer.innerText = 'Contact: How to reach me.\n\nEmail: example@example.com\nWebsite: example.com';
        break;
      default:
        viewer.innerText = 'Select an item from the sidebar to view content.';
    }
  }
  