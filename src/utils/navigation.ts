export const openExternalUrl = (url: string) => {
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // Cross-origin restriction
  }

  try {
    window.location.href = url;
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Ignored
    }
  }
};

export const navigateToExternal = (url: string, e?: React.MouseEvent) => {
  // Try navigating immediately
  try {
    if (window.top && window.top !== window) {
      if (e) {
        e.preventDefault();
      }
      window.top.location.href = url;
      return;
    }
  } catch {
    // Cross-origin iframe environment
  }

  // Standalone or fallback: let the browser follow standard link or change location
  try {
    window.location.href = url;
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback
    }
  }
};
