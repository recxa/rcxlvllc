document.querySelectorAll('.sidebar ul li').forEach(item => {
    item.addEventListener('click', () => {
      const contentId = item.getAttribute('data-content');
      if (contentId) {
        showContent(contentId);
      }
    });
  });
  
  function showContent(contentId) {
    const viewer = document.getElementById('viewer');
    switch(contentId) {
      case 'home':
        viewer.innerText = 'Welcome to the home directory.\n\nExplore various folders to find more content.';
        break;
      case 'cv':
        viewer.innerText = 'CV: Here is my CV with all relevant information and history.';
        break;
      case 'rcx':
        viewer.innerText = 'RCX Experiments:\n\n01: Experiment details.\n02: More experiment details.';
        break;
      case '01':
        viewer.innerText = 'Experiment 01: Initial findings and analysis.';
        break;
      case '02':
        viewer.innerText = 'Experiment 02: Deeper insights and results.';
        break;
      case '03':
        viewer.innerText = 'Experiment 03: Adjustments and further tests.';
        break;
      case '04':
        viewer.innerText = 'Experiment 04: Breakthroughs and setbacks.';
        break;
      case '05':
        viewer.innerText = 'Experiment 05: Final conclusions.';
        break;
      case 'music':
        viewer.innerText = '♪ Music: A collection of my audio projects and soundscapes.';
        break;
      case 'crumbs':
        viewer.innerText = 'Crumbs: Smaller projects and notes.';
        break;
      default:
        viewer.innerText = 'Select an item from the sidebar to view content.';
    }
  }
  