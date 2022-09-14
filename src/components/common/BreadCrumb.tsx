import classnames from 'classnames';
import * as React from 'react'
import { Link, NavLink, useHistory, useLocation } from 'react-router-dom'
import { capitalize } from '../../utils';
import { MenuItems } from '../App/App';

export interface IBreadCrumbLink {
	label: string,
	link: string
}

interface IBreadCrumbProps {
	// breadCrumbLinks: IBreadCrumbLink[]
}

const BreadCrumb: React.VoidFunctionComponent<IBreadCrumbProps> = (props) => {
	const history = useHistory();
	const location = useLocation();

	let [items, setItems] = React.useState<IBreadCrumbLink[]>([])

	React.useEffect(() => {
		setItems(getBreadCrumbLinks())
	}, [location])

	const getBreadCrumbLinks = (): IBreadCrumbLink[] => {
		let m = MenuItems.find((menuItem) => location.pathname.startsWith(menuItem.link))

		let steps: IBreadCrumbLink[] = []
		if (m) {
			steps.push({ label: m.name, link: m.link })

			if (location.pathname != m.link) {
				// get other steps 
				let parts = (location.pathname.replace(m.link + '/', "")).split("/")
				console.log('_parts ', parts);

				if (parts.length > 0) {
					steps.push({ label: capitalize(parts[0].trim()), link: location.pathname })
				}
			}
		}

		return steps
	}

	return (<div className="breadcrumb">

		<div className='breadcrumb-item'>
			<NavLink className="link" to={'/'}>Dashboard</NavLink>
		</div>
		{
			items.map((breadCrumbLink, index) => {
				let active = index == (items.length - 1)
				return (<div className={classnames('breadcrumb-item', { "active": active })} key={index} >
					<NavLink className="link" to={breadCrumbLink.link}>{breadCrumbLink.label}</NavLink>
				</div>)
			})
		}
	</div>)
}

export default BreadCrumb;
