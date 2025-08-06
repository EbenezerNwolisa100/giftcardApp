import React from 'react';

const QuickStats = ({ stats }) => {
  const formatCurrency = (amount) => {
    return `₦${Number(amount).toLocaleString()}`;
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.userCount?.toLocaleString(),
      subtitle: `+${stats.recentUsers} this month`,
      icon: 'bi-people',
      color: 'primary',
      bgColor: 'text-bg-primary'
    },
    {
      title: 'Buy Transactions',
      value: formatCurrency(stats.totalBuyAmount || 0),
      subtitle: `${stats.buyCount} transactions`,
      icon: 'bi-cart-plus',
      color: 'success',
      bgColor: 'text-bg-success'
    },
    {
      title: 'Sell Transactions',
      value: formatCurrency(stats.totalSellAmount || 0),
      subtitle: `${stats.sellCount} transactions`,
      icon: 'bi-cart-check',
      color: 'info',
      bgColor: 'text-bg-info'
    },
    {
      title: 'Withdrawals',
      value: formatCurrency(stats.totalWithdrawalVolume || 0),
      subtitle: `${stats.withdrawalCount} total, ${stats.pendingWithdrawals} pending`,
      icon: 'bi-cash-stack',
      color: 'warning',
      bgColor: 'text-bg-warning'
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {statCards.map((card, index) => (
        <div key={index} className="col-6 col-md-3">
          <div className={`card ${card.bgColor} h-100 border-0 shadow-sm`}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-white-50 mb-1">{card.title}</h6>
                  <h3 className="card-text mb-1">{card.value}</h3>
                  <small className="text-white-75">{card.subtitle}</small>
                </div>
                <div className="bg-white bg-opacity-25 rounded p-2">
                  <i className={`bi ${card.icon} text-white fs-4`}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats; 