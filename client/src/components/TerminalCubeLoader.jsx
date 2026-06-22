const TerminalCubeLoader = ({ text = 'Running code...' }) => {
  return (
    <div className="terminal-cube-loader-wrap">
      <div className="terminal-cube-loader" aria-label="Running code">
        <div className="terminal-cube"></div>
        <div className="terminal-cube"></div>
        <div className="terminal-cube"></div>
        <div className="terminal-cube"></div>
      </div>
      {text && <p className="terminal-cube-text">{text}</p>}
    </div>
  );
};

export default TerminalCubeLoader;
