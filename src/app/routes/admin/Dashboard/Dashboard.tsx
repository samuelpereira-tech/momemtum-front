import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import PageHeader from '../../../../components/admin/PageHeader/PageHeader'
import '../../../../components/admin/admin.css'

export default function Dashboard() {
  return (
    <>
      <TopNavbar />
      <div className="admin-container">
        <Sidebar />
        <PageHeader
          title="Dashboard"
          breadcrumbs={[
            { label: 'Home', icon: 'fa-solid fa-home', link: '#' },
            { label: 'Dashboard' }
          ]}
        />
        <main className="main-content">
          <div className="cards-grid">
            <div className="card">
              <div className="card-icon" style={{background: 'linear-gradient(135deg, var(--color-purple), var(--color-teal))'}}>
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="card-content">
                <h3 className="card-title">Total de Usuários</h3>
                <p className="card-value">1,234</p>
                <span className="card-change positive">
                  <i className="fa-solid fa-arrow-up"></i> 12% este mês
                </span>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}
