import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => (
  <nav className="d-none d-md-block bg-light sidebar position-fixed vh-100" style={{width: 220, left: 0, top: 0, zIndex: 1000}}>
    <div className="sidebar-sticky pt-3">
      <ul className="nav flex-column">
        <li className="nav-item">
          <NavLink to="/dashboard" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-speedometer2 me-2"></i> Dashboard
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/users" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-people me-2"></i> Users
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/transactions" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-receipt me-2"></i> Gift Card Transactions
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/wallet-transactions" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-wallet2 me-2"></i> Wallet Transactions
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/withdrawals" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-cash-stack me-2"></i> Withdrawals
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/giftcard-categories" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-tags me-2"></i> Gift Card Categories
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/giftcard-brands" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-card-image me-2"></i> Gift Card Brands
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/giftcard-inventory" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-card-image me-2"></i> Gift Card Inventory
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/support-requests" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-card-image me-2"></i> Support Requests
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/bank-details" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-bank me-2"></i> Bank Details
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/settings" className={({isActive}) => 'nav-link' + (isActive ? ' active fw-bold' : '')}>
            <i className="bi bi-bank me-2"></i> Settings
          </NavLink>
        </li>
      </ul>
    </div>
  </nav>
);

export default Sidebar; 