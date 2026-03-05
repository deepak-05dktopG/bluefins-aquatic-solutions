import { useLocation, useNavigate } from 'react-router-dom'
import { clearAdminToken } from '../../utils/adminAuth'

const AdminNavbar = () => {
	const location = useLocation()
	const navigate = useNavigate()

	const handleLogout = () => {
		clearAdminToken()
		navigate('/', { replace: true })
	}

	const isDashboard = location.pathname === '/admin/dashboard'
	const isOfflineMembership = location.pathname === '/admin/offline-membership'

	const linkStyle = (active) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		padding: '10px 18px',
		background: active ? 'rgba(0, 255, 212, 0.15)' : 'transparent',
		color: active ? '#00FFD4' : 'rgba(255, 255, 255, 0.7)',
		border: active ? '1px solid #00FFD4' : '1px solid transparent',
		borderRadius: '8px',
		textDecoration: 'none',
		fontWeight: 500,
		fontSize: '0.9rem',
		transition: 'all 0.3s ease',
	})

	return (
		<nav
			className="admin-navbar"
			style={{
				background: 'rgba(15, 25, 50, 0.95)',
				border: '1px solid rgba(0, 255, 200, 0.2)',
				borderLeft: 'none',
				borderRight: 'none',
				padding: 'clamp(10px, 2.2vw, 15px) clamp(14px, 4vw, 40px)',
				position: 'sticky',
				top: 0,
				zIndex: 1000,
				backdropFilter: 'blur(10px)',
			}}
		>
			<div
				className="admin-navbar__inner"
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					maxWidth: '1400px',
					margin: '0 auto',
					gap: '16px',
				}}
			>
				{/* Logo/Name (redirect to client homepage) */}
				<Link
					to="/"
					className="admin-navbar__brand"
					style={{
						textDecoration: 'none',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
					}}
				>
					<img
						src="/assets/Logo.png"
						alt="Bluefins Logo"
						style={{ height: '40px', width: 'auto', filter: 'drop-shadow(0 0 8px rgba(0, 255, 212, 0.3))' }}
					/>
					<h1
						style={{
							margin: 0,
							fontSize: 'clamp(1.05rem, 3.2vw, 1.5rem)',
							fontWeight: 700,
							background: 'linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
						}}
					>
						Bluefins Admin
					</h1>
				</Link>

				<div className="admin-navbar__links" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
					<Link to="/admin/dashboard" style={linkStyle(isDashboard)}>
						<FaRocket /> Dashboard
					</Link>

					<Link to="/admin/offline-membership" style={linkStyle(isOfflineMembership)}>
						<FaRocket /> Offline Membership
					</Link>

					<button
						onClick={handleLogout}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '10px 18px',
							background: 'rgba(255, 50, 100, 0.2)',
							color: '#FF6B9D',
							border: '1px solid rgba(255, 50, 100, 0.4)',
							borderRadius: '8px',
							cursor: 'pointer',
							fontWeight: 500,
							fontSize: '0.9rem',
							transition: 'all 0.3s ease',
						}}
					>
						<FaSignOutAlt /> Logout
					</button>
				</div>
			</div>
		</nav>
	)
}

export default AdminNavbar
