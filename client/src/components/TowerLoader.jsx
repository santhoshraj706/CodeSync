const TowerLoader = ({ text = 'Loading...', size, fullScreen, className = '' }) => {
  if (fullScreen) {
    return (
      <div className={`tower-loader-fullscreen ${className}`} aria-label="Loading">
        <div className="tower-loader-inner">
          <div className="tower-loader" style={size ? { transform: `scale(${size})` } : undefined}>
            <div className="tower-box tower-box-1">
              <div className="tower-side-left"></div>
              <div className="tower-side-right"></div>
              <div className="tower-side-top"></div>
            </div>
            <div className="tower-box tower-box-2">
              <div className="tower-side-left"></div>
              <div className="tower-side-right"></div>
              <div className="tower-side-top"></div>
            </div>
            <div className="tower-box tower-box-3">
              <div className="tower-side-left"></div>
              <div className="tower-side-right"></div>
              <div className="tower-side-top"></div>
            </div>
            <div className="tower-box tower-box-4">
              <div className="tower-side-left"></div>
              <div className="tower-side-right"></div>
              <div className="tower-side-top"></div>
            </div>
          </div>
          {text && <p className="tower-loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`tower-loader-wrapper ${className}`} aria-label="Loading">
      <div className="tower-loader-inner">
        <div className="tower-loader" style={size ? { transform: `scale(${size})` } : undefined}>
          <div className="tower-box tower-box-1">
            <div className="tower-side-left"></div>
            <div className="tower-side-right"></div>
            <div className="tower-side-top"></div>
          </div>
          <div className="tower-box tower-box-2">
            <div className="tower-side-left"></div>
            <div className="tower-side-right"></div>
            <div className="tower-side-top"></div>
          </div>
          <div className="tower-box tower-box-3">
            <div className="tower-side-left"></div>
            <div className="tower-side-right"></div>
            <div className="tower-side-top"></div>
          </div>
          <div className="tower-box tower-box-4">
            <div className="tower-side-left"></div>
            <div className="tower-side-right"></div>
            <div className="tower-side-top"></div>
          </div>
        </div>
        {text && <p className="tower-loader-text">{text}</p>}
      </div>
    </div>
  );
};

export default TowerLoader;
