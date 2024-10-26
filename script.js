// Function to toggle visibility for expandable items, including folders without triangles
document.querySelectorAll('.folder, .expandable').forEach(item => {
    item.addEventListener('click', (event) => {
      const nested = item.querySelector('.nested');
      if (nested) {
        const isOpen = nested.style.display === 'block';
        nested.style.display = isOpen ? 'none' : 'block';
        item.classList.toggle('open', !isOpen);
      }
      event.stopPropagation(); // Prevent triggering parent folder toggling
    });
  });
  
  // Show content when clicking on files
  document.querySelectorAll('[data-content]').forEach(item => {
    item.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent triggering folder toggling
      const contentId = item.getAttribute('data-content');
      showContent(contentId);
    });
  });
  
  function showContent(contentId) {
    const viewer = document.getElementById('viewer');
    const lifebrushContainer = document.getElementById('lifebrush-container');

    // Hide both containers initially
    viewer.style.display = 'none';
    lifebrushContainer.style.display = 'none';

    switch(contentId) {
      case 'home':
        viewer.style.display = 'block';
        viewer.innerText = 'Welcome to the home directory.\n\nExplore various folders to find more content.';
        break;
      case 'cv':
        viewer.style.display = 'block';
        viewer.innerText = 'CV: Here is my CV with all relevant information and history.';
        break;
      case '01-readme':
        viewer.style.display = 'block';
        viewer.innerText = 'README for Experiment 01: Overview and purpose.';
        break;
      case '02-readme':
        viewer.style.display = 'block';
        viewer.innerText = 'README for Experiment 02: Initial setup and goals.';
        break;
      case '03-readme':
        viewer.style.display = 'block';
        viewer.innerText = 'README for Experiment 03: Methodology and approach.';
        break;
      case '04-readme':
        viewer.style.display = 'block';
        viewer.innerText = 'README for Experiment 04: Analysis of results.';
        break;
      case '05-readme':
        viewer.style.display = 'block';
        viewer.innerText = 'README for Experiment 05: Summary and final thoughts.';
        break;
      case 'music':
        viewer.style.display = 'block';
        viewer.innerText = '♪ Music: A collection of my audio projects and soundscapes.';
        break;
      case 'crumbs':
        viewer.style.display = 'block';
        viewer.innerText = 'Crumbs: Smaller projects and notes.';
        break;
      case 'lifebrush':
        lifebrushContainer.style.display = 'block';
        break;
      default:
        viewer.style.display = 'none';
        break;
    }
  }