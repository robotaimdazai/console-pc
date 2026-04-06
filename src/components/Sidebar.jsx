export default function Sidebar({ items, onClose }) {
  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <div className="sidebar" onClick={(e) => e.stopPropagation()}>
        <h2 className="sidebar-title">Menu</h2>
        <div className="sidebar-items">
          {items.map((item) => (
            <button
              key={item.label}
              className="sidebar-item"
              onClick={item.action}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
