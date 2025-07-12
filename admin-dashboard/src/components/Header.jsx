import React from 'react';

const Header = ({ handleLogout }) => (
  <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-3">
    <a className="navbar-brand fw-bold" href="/dashboard">Giftcard Admin</a>
    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="ms-auto">
      <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
    </div>
  </nav>
);

export default Header; 