import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" 
          style={{ zIndex: 1035 }}
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`bg-white shadow-sm border-end position-fixed top-0 start-0 h-100 transition-all ${
          isOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'
        }`}
        style={{
          width: '260px',
          zIndex: 1040,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Mobile Toggle Button */}
        <button
          className="btn btn-link position-absolute top-0 end-0 d-md-none p-2"
          onClick={toggleSidebar}
          style={{ zIndex: 1045, color: '#6c757d' }}
        >
          <i className="bi bi-x-lg fs-4"></i>
        </button>

    {/* Logo Section */}
        <div className="p-4 border-bottom position-sticky top-0 bg-white" style={{zIndex: 1050}}>
      <div className="d-flex align-items-center">
        <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 me-3" 
                 style={{width: '36px', height: '36px'}}>
              <i className="bi bi-credit-card text-white fs-6"></i>
        </div>
        <div>
              <h5 className="fw-bold text-dark mb-0" style={{fontSize: '1.1rem'}}>GiftYard</h5>
              <small className="text-muted" style={{fontSize: '0.75rem'}}>Admin Dashboard</small>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="p-3">
      <div className="mb-4">
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-speedometer2 me-3 fs-6"></i>
          <span className="fw-medium">Dashboard</span>
        </NavLink>

        <NavLink 
          to="/users" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-people me-3 fs-6"></i>
          <span className="fw-medium">Users</span>
        </NavLink>

        <NavLink 
          to="/transactions" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-receipt me-3 fs-6"></i>
          <span className="fw-medium">Gift Card Transactions</span>
        </NavLink>

        <NavLink 
          to="/wallet-transactions" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-wallet2 me-3 fs-6"></i>
          <span className="fw-medium">Wallet Transactions</span>
        </NavLink>

        <NavLink 
          to="/withdrawals" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-cash-stack me-3 fs-6"></i>
          <span className="fw-medium">Withdrawals</span>
        </NavLink>
      </div>

      {/* Gift Cards Section */}
      <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-bold small px-3 mb-2" style={{fontSize: '0.7rem', letterSpacing: '0.5px'}}>Gift Cards</h6>
        
        <NavLink 
          to="/giftcard-categories" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-tags me-3 fs-6"></i>
          <span className="fw-medium">Categories</span>
        </NavLink>

        <NavLink 
          to="/giftcard-brands" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-card-image me-3 fs-6"></i>
          <span className="fw-medium">Brands</span>
        </NavLink>

        <NavLink 
          to="/giftcard-inventory" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-box-seam me-3 fs-6"></i>
          <span className="fw-medium">Inventory</span>
        </NavLink>
      </div>

      {/* Support Section */}
      <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-bold small px-3 mb-2" style={{fontSize: '0.7rem', letterSpacing: '0.5px'}}>Support</h6>
        
        <NavLink 
          to="/support-requests" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-headset me-3 fs-6"></i>
          <span className="fw-medium">Support Requests</span>
        </NavLink>
      </div>

      {/* Settings Section */}
      <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-bold small px-3 mb-2" style={{fontSize: '0.7rem', letterSpacing: '0.5px'}}>Settings</h6>
        
        <NavLink 
          to="/bank-details" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-bank me-3 fs-6"></i>
          <span className="fw-medium">Bank Details</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({isActive}) => 
                `d-flex align-items-center px-3 py-2 text-decoration-none rounded-3 mb-1 transition-all ${
              isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-dark hover-bg-light'
            }`
          }
              style={{fontSize: '0.9rem'}}
              onClick={toggleSidebar}
        >
              <i className="bi bi-gear me-3 fs-6"></i>
          <span className="fw-medium">Settings</span>
        </NavLink>
      </div>
    </nav>
  </div>
    </>
);
};

export default Sidebar; 