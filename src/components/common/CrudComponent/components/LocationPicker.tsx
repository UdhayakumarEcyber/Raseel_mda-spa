import { Control, LatLngExpression, LatLngTuple, Layer, map } from 'leaflet';
import GeoJson, { Position } from 'geojson'
import * as React from 'react';
import { Circle, CircleMarker, FeatureGroup, LayerGroup, Map, MapControl, Marker, Polygon, Popup, TileLayer, Tooltip, ZoomControl } from 'react-leaflet';
// import { EditControl } from 'react-leaflet-draw';
import { Button, Label, Modal, Tooltip as UXPTooltip } from 'uxp/components';
import { Conditional } from '../../ConditionalComponent';

import pinMap from "../../../../assets/images/pin-map.svg";
import cancel from "../../../../assets/images/cancel.svg";
import save from "../../../../assets/images/tick.svg";
import reset from "../../../../assets/images/reset.svg";
import draw from "../../../../assets/images/draw.svg";

// const centerCoords: LatLngExpression = [24.5247, 39.5692]
interface ILocationPickerProps {
	label: string;
	location: GeoJSON.Polygon | GeoJSON.Point;
	editable: boolean;
	name: string;
	regions?: GeoJSON.Polygon | GeoJSON.Point;
	regionsName?: string;
	locationTitle?: string;
	mapType?: "Point" | "Polygon";
	onChange?: (val: any) => void;
	zoom: number,
	setZoom: (zoom:number) => void
}


const LocationPicker: React.FunctionComponent<ILocationPickerProps> = (props) => {
	// it works with spots or regions
	// edit redraw delete
	const { location, label } = props;

	const [prevLocation, setPrevLocation] = React.useState<GeoJSON.Polygon | GeoJSON.Point>(null);

	const [show, setShow] = React.useState<boolean>(false);
	const [modified, setModified] = React.useState<boolean>(false);

	React.useEffect(() => {
		// if(!location?.coordinates) setPrevLocation()
		setPrevLocation(location);
	}, [])

	return <>
		<div>
			<button
				className="uxp-button btn-location-picker"
				type="button"
				onClick={() => setShow(prev => !prev)}>
				<div className="icon" style={{ backgroundImage: `url("${pinMap}")` }}></div>
				{modified ? "Change" : label}</button>
		</div>
		<Modal
			show={show}
			onClose={() => setShow(false)}
			showCloseButton={false}
			title={"Location Picker"}
			className={"mda-location-picker"}
			backgroundDismiss={true}
		>
			<LocationMap {...props} setModified={setModified} setShow={setShow} prevLocation={prevLocation}></LocationMap>
		</Modal>
	</>
}

interface ILocationMapProps extends ILocationPickerProps {
	spots?: GeoJson.Point[];
	// regions?: GeoJson.Polygon[];
	prevLocation: GeoJson.Point | GeoJson.Polygon;
	gotoLocation?: (location: GeoJson.Point | GeoJson.Polygon, zoom: number) => void;
	setModified?: (modified: boolean) => void,
	setShow: (show: boolean) => void
}

const LocationMap: React.FunctionComponent<ILocationMapProps> = props => {
	const { location, zoom, setZoom, setShow, setModified, onChange, prevLocation, regions, regionsName, locationTitle, mapType } = props
	// const [zoom, setZoom] = React.useState<number>(14);
	const [centerOfMap, setCenterOfMap] = React.useState<LatLngExpression>([24.467659693568866, 39.61115569920074])
	const [locationType, setLocationType] = React.useState<"Point" | "Polygon">(mapType);
	const [spot, setSpot] = React.useState<LatLngExpression>(null);
	const [region, setRegion] = React.useState<LatLngExpression[] | LatLngExpression[][]>(null)
	// const [region, setRegion] = React.useState<any>(null)
	const [drawing, setDrawing] = React.useState<boolean>(false);

	const mapRef = React.useRef<Map>()
	const drawnLayer = React.useRef<Layer>();
	const polyRef = React.useRef<Polygon>()

	const gotoPositionOfMap = (location: GeoJson.Point | GeoJson.Polygon, zoomLevel?: number) => {
		if (zoomLevel) {
			setZoom(zoomLevel);
		}
		let geoJsonCoordinates: GeoJson.Position = null;
		if (location?.type === 'Point') {
			geoJsonCoordinates = location?.coordinates as GeoJson.Position;
		} else {
			geoJsonCoordinates = location?.coordinates[0][0] as GeoJson.Position;
		}
		setCenterOfMap([geoJsonCoordinates[1], geoJsonCoordinates[0]]);
	}

	// React.useEffect(, [mapRef])
	const handleDraw = () => {
		if (mapRef.current) {
			if (!drawing) {
				setRegion(null);
				mapRef.current.leafletElement?.editTools?.startPolygon()
				setDrawing(true)
				if (!drawnLayer.current) return;
				mapRef.current.leafletElement.removeLayer(drawnLayer.current);
			}
			else {
				mapRef.current.leafletElement?.editTools?.stopDrawing()
				setDrawing(false)
			}
		}
	}

	React.useEffect(() => {
		const editingHandler = (e: any) => {
			drawnLayer.current = e.layer;
			const coords = e.layer.toGeoJSON().geometry?.coordinates as LatLngExpression[][]
			if (!coords[0][0]) return
			setRegion([...coords]);
		}
		const drawEnd = (e: any) => {
			setDrawing(false)
		}

		mapRef?.current?.leafletElement?.off("editable:editing")
		mapRef?.current?.leafletElement?.on("editable:editing", editingHandler)
		mapRef?.current?.leafletElement?.off("editable:drawing:end")
		mapRef?.current?.leafletElement?.on("editable:drawing:end", drawEnd)
	}, [mapRef]);

	const setLocation = (location: GeoJson.Polygon | GeoJson.Point) => {
		if (location?.type === "Point" || locationType === "Point") {
			setSpot(location?.coordinates as LatLngExpression)
		} else {
			setRegion(location?.coordinates as LatLngExpression[][])
		}
		if (location?.coordinates) {
			gotoPositionOfMap(location, zoom)
		}
		location?.type && setLocationType(location?.type)
	}

	React.useEffect(() => {
		setLocation(location)
	}, [location])

	React.useEffect(() => {
		if (regions.coordinates) {
			gotoPositionOfMap(regions, zoom)
		}
	}, [regions])

	const handleClick = (e: any) => {
		if (locationType === "Point") {
			const { latlng: { lat, lng } } = e;
			setSpot([lng, lat])
		}
	}

	const handleReset = (e: any) => {
		setLocation(prevLocation)
		onChange(prevLocation);
		setModified(false)
		if (!mapRef.current || !mapRef.current.leafletElement || !drawnLayer.current) return;
		mapRef.current.leafletElement.removeLayer(drawnLayer.current);
	}

	const handleSave = () => {
		let newLocation = null
		if (spot || region) {
			newLocation = { ...location, type: locationType, coordinates: (locationType === "Point") ? spot : region }
		}
		onChange(newLocation);
		setShow(false);
		setModified(JSON.stringify(newLocation) !== JSON.stringify(prevLocation));
	}

	return <>
		<div className='location-picker-controller'>
			<button onClick={handleReset} className="uxp-button map-control-button">
				<div className="icon" style={{ backgroundImage: `url("${reset}")` }}></div>
				Reset
			</button>
			<Conditional visible={locationType === "Polygon"} >
				<button onClick={handleDraw} className="uxp-button map-control-button">
					<div className="icon" style={{ backgroundImage: `url("${draw}")` }}></div>
					{drawing ? "Stop Drawing" : region ? "Edit" : "Start"}
				</button>
			</Conditional>
			<button onClick={() => { setShow(false); }} className="uxp-button map-control-button">
				<div className="icon" style={{ backgroundImage: `url("${cancel}")` }}></div>
				Cancel
			</button>
			<button onClick={handleSave} className="uxp-button map-control-button">
				<div className="icon" style={{ backgroundImage: `url("${save}")` }}></div>
				Save
			</button>
		</div>
		<Map
			id="location-picker-map"
			onzoom={(e) => setZoom(e.target._zoom)}
			onclick={handleClick}
			editable={true}
			ref={mapRef}
			zoom={zoom}
			maxZoom={22}
			center={centerOfMap}
		// useFlyTo={true}
		>
			<TileLayer
				url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
				attribution='&amp;copy <a href="https://www.google.com/intl/en-US/help/terms_maps/">Google Maps</a>'
				subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
			/>
			{region && <Polygon ref={polyRef} positions={((region[0] as Position[])?.map((tuple: LatLngTuple) => ({ lat: tuple[1], lng: tuple[0] }))) as LatLngExpression[]} color="blue"
			>
				{locationTitle && <Tooltip opacity={1} direction={'top'} permanent={true}>{locationTitle}</Tooltip>}
			</Polygon>}
			{spot && <Marker position={{ lat: (spot as Position)[1], lng: (spot as Position)[0] } as LatLngExpression}>
				{locationTitle && <Tooltip opacity={1} direction={'right'} permanent={true}>{locationTitle}</Tooltip>}
			</Marker>
			}

			{regions?.coordinates && regions.type === "Polygon" &&
				<Polygon ref={polyRef} positions={((regions?.coordinates[0] as Position[])?.map((tuple: LatLngTuple) => ({ lat: tuple[1], lng: tuple[0] }))) as LatLngExpression[]} color="green"
				>
					{regionsName && <Tooltip opacity={1} direction={'top'} permanent={true}>{regionsName}</Tooltip>}
				</Polygon>
			}

			{regions?.coordinates && regions.type === "Point" &&
				<Circle radius={2} color={"green"} center={{ lat: (regions?.coordinates as Position)[1], lng: (regions?.coordinates as Position)[0] } as LatLngExpression}>
					{regionsName && <Tooltip opacity={1} direction={'top'} permanent={true}>{regionsName}</Tooltip>}
				</Circle>
			}

		</Map>
	</>
}

export { LocationPicker };