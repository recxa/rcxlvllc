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

async function loadReadme(number) {
  try {
    const response = await fetch(`readme/${number}.txt`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error loading README:', error);
    return 'Error loading README file.';
  }
}

async function showContent(contentId) {
  const viewer = document.getElementById('viewer');
  const lifebrushContainer = document.getElementById('lifebrush-container');

  viewer.style.display = 'none';
  lifebrushContainer.style.display = 'none';

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
    case '01-readme':
    case '02-readme':
    case '03-readme':
    case '04-readme':
    case '05-readme':
      const number = contentId.split('-')[0];
      viewer.style.display = 'block';
      viewer.innerText = 'Loading...';
      const content = await loadReadme(number);
      viewer.innerText = content;
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