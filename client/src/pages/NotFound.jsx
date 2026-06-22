import { Link } from 'react-router-dom';
import { Home, LogIn } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="notfound-page">
      <div className="notfound-wrapper">
        <div className="notfound-main">
          <div className="notfound-antenna">
            <div className="notfound-antenna-shadow"></div>
          </div>
          <div className="notfound-a1"></div>
          <div className="notfound-a1d"></div>
          <div className="notfound-a2"></div>
          <div className="notfound-a2d"></div>
          <div className="notfound-tv">
            <div className="notfound-display">
              <div className="notfound-screen-out">
                <div className="notfound-screen-out1">
                  <div className="notfound-screen">
                    <span className="notfound-screen-text">404</span>
                  </div>
                  <div className="notfound-screen-m">
                    <span className="notfound-screen-text">404</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="notfound-lines">
              <div className="notfound-line1"></div>
              <div className="notfound-line2"></div>
              <div className="notfound-line3"></div>
            </div>
            <div className="notfound-buttons">
              <div className="notfound-b1"><div></div></div>
              <div className="notfound-b2"></div>
            </div>
            <div className="notfound-speakers">
              <div className="notfound-g1">
                <div className="notfound-g11"></div>
                <div className="notfound-g12"></div>
                <div className="notfound-g13"></div>
              </div>
              <div className="notfound-g"></div>
              <div className="notfound-g"></div>
            </div>
          </div>
          <div className="notfound-bottom">
            <div className="notfound-base1"></div>
            <div className="notfound-base2"></div>
          </div>
          <div className="notfound-base3"></div>
          <div className="notfound-text-404">
            <div className="notfound-text-404-1">4</div>
            <div className="notfound-text-404-2">0</div>
            <div className="notfound-text-404-3">4</div>
          </div>
          <div className="notfound-actions">
            <Link to="/" className="notfound-action-btn notfound-action-home">
              <Home className="w-4 h-4" /> Go Home
            </Link>
            <Link to="/login" className="notfound-action-btn notfound-action-login">
              <LogIn className="w-4 h-4" /> Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
