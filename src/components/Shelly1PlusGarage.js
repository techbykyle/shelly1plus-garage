import React, { useEffect } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

const Shelly1PlusGarage = ({tile, mqtt, updateTile, useMqtt, useMqttSub}) => {

    const device_state = useSelector(state => state.DeviceController.data[tile.id], shallowEqual) || {}
    const dispatch = useDispatch()
    const mqtt_client = useMqtt()
    const events = device_state[mqtt['events']]?.params
    const init_state = device_state[`${tile.id}/rpc`]?.result
    const isOpen = device_state.isOpen
    const is_open_txt = isOpen ? 'Open': 'Closed'
    const style = isOpen ? { color: '#f59598' }: {}

    if(events === undefined && init_state && 'state' in init_state) {
        if(init_state.state === false) {
            updateTile(dispatch, tile.id, {isOpen: true})
        }   
        if(init_state.state === true) {
            updateTile(dispatch, tile.id, {isOpen: false})
        }   
    }
 
    if(events && 'input:0' in events) {
        if(events['input:0'].state === false) {
            updateTile(dispatch, tile.id, {isOpen: true})
        }
        if(events['input:0'].state === true) {
            updateTile(dispatch, tile.id, {isOpen: false, isClosing: false})
        }
    }

    if(events && 'switch:0' in events) {
        if(isOpen && events['switch:0'].output === true) {
            updateTile(dispatch, tile.id, {isClosing: true})
        }
        if(!isOpen && events['switch:0'].output === true) {
            updateTile(dispatch, tile.id, {isOpening: true})
        }
    }
 
    useMqttSub(mqtt_client, mqtt['events'], tile.id)
    useMqttSub(mqtt_client, `${tile.id}/rpc`, tile.id)

    useEffect(() => {
        if(device_state.isOpening) {
            setTimeout(() => {
                updateTile(dispatch, tile.id, {isOpening: false})
            }, 15000)
        }
    }, [device_state.isOpening])

    useEffect(() => {
        if(mqtt_client && 'publish' in mqtt_client) {
            mqtt_client.publish(mqtt['state'], `{"id":0, "src":"${tile.id}", "method":"Input.GetStatus", "params":{"id":0}}`)
        }
    }, [mqtt_client])

    const handleClick = () => {
        mqtt_client.publish(mqtt['state'], `{"id":0, "src":"notused", "method":"Switch.Toggle", "params":{"id":0}}`)
    }

    if(device_state.isOpening || device_state.isClosing) {

        const door_state = device_state.isOpening ? 'Opening': 'Closing'

        return <div className="txt_center"><br />
            <div className="button_loader button_loader_l"></div>
            <p>{door_state} Door...</p>
        </div>
    }

    return (
        <div className="txt_center">
            <div className="tile-icon">
                <span 
                    onClick={handleClick} 
                    title={`Garage Door is: ${is_open_txt}`}
                    style={style} 
                    className="material-icons f75 pointer"
                >sensor_door</span>
            </div>
            <div style={style}>{is_open_txt}</div>
        </div>
    )
}

export default Shelly1PlusGarage