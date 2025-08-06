import React from 'react';
import NotificationBell from './NotificationBell';

const Header = ({ handleLogout, toggleSidebar }) => (
  <header className="bg-white border-bottom shadow-sm px-4 py-3 position-fixed top-0 end-0 start-0 main-header" 
          style={{ 
            zIndex: 1030, 
            marginLeft: '260px',
            height: '70px',
            display: 'flex',
            alignItems: 'center'
          }}>
    <div className="d-flex align-items-center justify-content-between w-100">
      {/* Left side - Mobile toggle and title */}
      <div className="d-flex align-items-center">
        {/* Mobile Toggle Button */}
        <button
          className="btn btn-link text-dark d-md-none me-3 p-0"
          onClick={toggleSidebar}
          style={{ fontSize: '1.5rem', lineHeight: 1 }}
        >
          <i className="bi bi-list"></i>
        </button>
        
        <h4 className="fw-bold text-dark mb-0 me-3" style={{fontSize: '1.25rem'}}>Dashboard</h4>
        <div className="d-none d-md-flex align-items-center text-muted">
          <span className="mx-2">•</span>
          <span className="small" style={{fontSize: '0.8rem'}}>Admin Panel</span>
        </div>
      </div>

      {/* Right side - User actions */}
      <div className="d-flex align-items-center gap-2">
        {/* Notifications */}
        <NotificationBell />

        {/* Help icon */}
        <button className="btn btn-link text-muted p-2 rounded-circle" 
                style={{width: '40px', height: '40px'}}
                title="Help">
          <i className="bi bi-question-circle fs-5"></i>
        </button>

        {/* User profile dropdown */}
        <div className="dropdown">
          <button className="btn btn-link text-dark text-decoration-none dropdown-toggle d-flex align-items-center p-2 rounded-circle" 
                  type="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{width: '40px', height: '40px'}}>
            <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle" 
                 style={{width: '32px', height: '32px'}}>
              <span className="text-white fw-medium small">A</span>
            </div>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{minWidth: '200px'}}>
            <li>
              <div className="dropdown-item-text px-3 py-2">
              <div className="fw-medium small">Admin User</div>
              <div className="text-muted" style={{fontSize: '0.75rem'}}>admin@giftyard.com</div>
            </div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item py-2" href="#"><i className="bi bi-person me-2"></i>Profile</a></li>
            <li><a className="dropdown-item py-2" href="#"><i className="bi bi-gear me-2"></i>Settings</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <a className="dropdown-item text-danger py-2" href="#" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </header>
);

export default Header; 