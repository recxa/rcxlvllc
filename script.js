// script.js
document.querySelectorAll('.folder, .expandable').forEach(item => {
  item.addEventListener('click', (event) => {
    const nested = item.querySelector('.nested');
    if (nested) {
      const isOpen = nested.style.display === 'block';
      nested.style.display = isOpen ? 'none' : 'block';
      item.classList.toggle('open', !isOpen);
    }
    event.stopPropagation();
  });
});

document.querySelectorAll('[data-content]').forEach(item => {
  item.addEventListener('click', (event) => {
    event.stopPropagation();
    const contentId = item.getAttribute('data-content');
    showContent(contentId);
  });
});

function showContent(contentId) {
  const viewer = document.getElementById('viewer');
  const lifebrushContainer = document.getElementById('lifebrush-container');

  viewer.style.display = 'none';
  lifebrushContainer.style.display = 'none';

  // Handle readme files
  if (contentId.startsWith('readme-')) {
    const readmeNumber = contentId.split('-')[1];
    fetch(`readme/${readmeNumber}.txt`)
      .then(response => {
        if (!response.ok) {
          throw new Error('README not found');
        }
        return response.text();
      })
      .then(content => {
        viewer.style.display = 'block';
        viewer.innerText = content;
      })
      .catch(error => {
        viewer.style.display = 'block';
        viewer.innerText = 'Error loading README file.';
        console.error('Error:', error);
      });
    return;
  }

  // Handle other content types
  switch(contentId) {
    case 'lifebrush':
      lifebrushContainer.style.display = 'block';
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        const canvas = lifebrushContainer.querySelector('canvas');
        if (canvas) {
          canvas.focus();
        }
        if (!window.isLifebrushInitialized && window.resetCanvas) {
          window.resetCanvas();
        }
      }, 0);
      break;
    case 'home':
      viewer.style.display = 'block';
      viewer.innerText = 'Welcome to the home directory.\n\nExplore various folders to find more content.';
      break;
    case 'cv':
      viewer.style.display = 'block';
      viewer.innerText = 'CV: Here is my CV with all relevant information and history.';
      break;
    case 'music':
      viewer.style.display = 'block';
      viewer.innerText = '♪ Music: A collection of my audio projects and soundscapes.';
      break;
    case 'crumbs':
      viewer.style.display = 'block';
      viewer.innerText = 'Crumbs: Smaller projects and notes.';
      break;
  }
}