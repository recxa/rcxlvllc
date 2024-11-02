// URLs mapping
const externalUrls = {
  'video-01-231204': 'https://youtu.be/aRytyQccBMQ?si=_-gvcENqTHm4psgT',
  'video-01-231213': 'https://youtu.be/Umu5TPqvm8M?si=N4JOLipWWAfMgIfa',
  'video-01-240816': 'https://youtu.be/rDcJgQN2-MM?si=gZcUJ4hbvcE-zLGx',
  'video-01-study': 'https://www.youtube.com/watch?v=qO98I7ExsLE',
  'video-02-may4a': 'https://youtu.be/FabqhSZxoMc?si=fq3ZZKbasKB52ARO',
  'video-02-may4b': 'https://youtu.be/gTIvsHuooVs?si=ZcoacU8ri-Mlxd8b',
  'video-02-may5a': 'https://youtu.be/N6xDdNZ2mj0?si=Gi7IaZFk3r9VZGuS',
  'video-02-may5b': 'https://youtu.be/FjHWJNS6lDw?si=ermK_fkiEJ3yxArZ',
  'video-03-a': 'https://www.youtube.com/watch?v=OjwYlEE2Fps',
  'video-03-b': 'https://youtu.be/E8PGipz2XiM',
  'video-03-c': 'https://youtu.be/your-video-id-10',
  'video-05-demo': 'https://youtu.be/pAJ_MM6agng?si=zeqQ_spAJ5S-VjY1',
  'git-01': 'https://github.com/recxa/rcx01',
  'git-02': 'https://github.com/recxa/rcx02',
  'git-03': 'https://github.com/recxa/rcx03',
  'git-05': 'https://github.com/recxa/rcx01',
  'video-02-stream': 'https://www.twitch.tv/recxa_lovelace'
};

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

  // Handle video links
  if (contentId.startsWith('video-')) {
    const videoUrl = externalUrls[contentId];
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
    return;
  }

  // Handle code links
  if (contentId.startsWith('git-')) {
    const gitUrl = externalUrls[contentId];
    if (gitUrl) {
      window.open(gitUrl, '_blank');
    }
    return;
  }

  // Handle readme files
  if (contentId.startsWith('readme-')) {
    const readmeNumber = contentId.split('-')[1];
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `readme/${readmeNumber}.txt`, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        viewer.style.display = 'block';
        viewer.innerText = xhr.responseText;
      } else {
        viewer.style.display = 'block';
        viewer.innerText = 'Error loading README file.';
      }
    };
    xhr.onerror = function() {
      viewer.style.display = 'block';
      viewer.innerText = 'Error loading README file.';
      console.error('Error loading file');
    };
    xhr.send();
    return;
  }

  // Handle code files
  if (contentId.startsWith('code-')) {
    const codeNumber = contentId.split('-')[1];
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `code/${codeNumber}.txt`, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        viewer.style.display = 'block';
        viewer.innerText = xhr.responseText;
      } else {
        viewer.style.display = 'block';
        viewer.innerText = 'Error loading code file.';
      }
    };
    xhr.send();
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
    // Add other cases as needed...
  }
}