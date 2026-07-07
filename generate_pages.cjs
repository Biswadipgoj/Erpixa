const fs = require('fs');
const path = require('path');

const pages = [
  { name: 'POSPage', title: 'Point of Sale', desc: 'Process sales and manage your registers.', icon: '🛍️' },
  { name: 'KitchenPage', title: 'Kitchen Display', desc: 'Manage orders and kitchen workflows.', icon: '🍳' },
  { name: 'TablesPage', title: 'Table Management', desc: 'Manage restaurant tables and seating.', icon: '🪑' },
  { name: 'MenuPage', title: 'Menu Management', desc: 'Update menus, categories, and pricing.', icon: '📖' },
  { name: 'DeliveryPage', title: 'Delivery Tracking', desc: 'Track deliveries and drivers.', icon: '🛵' },
  { name: 'ReservationsPage', title: 'Reservations', desc: 'Manage bookings and appointments.', icon: '📅' },
  { name: 'BOMPage', title: 'Bill of Materials', desc: 'Define product components and recipes.', icon: '📋' },
  { name: 'MRPPage', title: 'MRP Planning', desc: 'Material requirements and production planning.', icon: '⚙️' },
  { name: 'FactoryPage', title: 'Factory Layout', desc: 'Manage factory floors and workcenters.', icon: '🏗️' },
  { name: 'MachinesPage', title: 'Machine Management', desc: 'Track machine health and maintenance.', icon: '📠' },
  { name: 'PurchasePage', title: 'Purchase Orders', desc: 'Manage supplier orders and procurement.', icon: '🛒' },
  { name: 'WarehousePage', title: 'Warehouse', desc: 'Manage locations, bins, and transfers.', icon: '🏬' },
  { name: 'ClientsPage', title: 'Client Portal', desc: 'Manage client onboarding and interactions.', icon: '🤝' },
  { name: 'DocumentsPage', title: 'Document Center', desc: 'Store and share important files.', icon: '📄' },
];

const template = (title, desc, icon) => `export default function PAGE_NAME() {
  return (
    <div className="fade-in" style={{ padding: 'var(--space-6)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-hero" style={{ '--hero-grad': 'var(--gradient-ai)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">${title}</h1>
          <div className="page-hero-sub">${desc}</div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }} aria-hidden="true">${icon}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
            No ${title} data yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
            Your workspace is empty. Create your first record to start using the ${title} module.
          </p>
          <button className="btn btn-primary">
            + Create First Record
          </button>
        </div>
      </div>
    </div>
  );
}
`;

pages.forEach(p => {
  const content = template(p.title, p.desc, p.icon).replace(/PAGE_NAME/g, p.name);
  fs.writeFileSync(path.join(__dirname, 'src', 'pages', p.name + '.tsx'), content);
});

console.log('Generated ' + pages.length + ' pages.');
