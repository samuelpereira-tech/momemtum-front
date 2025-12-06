import { Link } from 'react-router-dom'
import '../admin.css'

interface BreadcrumbItem {
  label: string
  icon?: string
  link?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs: BreadcrumbItem[]
}

export default function PageHeader({ title, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-title-card">
        <h2 className="page-title">{title}</h2>
      </div>
      <nav className="breadcrumbs-card">
        {breadcrumbs.map((item, index) => (
          <span key={index} className="breadcrumb-item">
            {index > 0 && <i className="fa-solid fa-chevron-right"></i>}
            {item.link ? (
              <Link to={item.link}>
                {item.icon && <i className={item.icon}></i>} {item.label}
              </Link>
            ) : (
              <>
                {item.icon && <i className={item.icon}></i>} {item.label}
              </>
            )}
          </span>
        ))}
      </nav>
    </div>
  )
}

