import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'

const Shelly1PlusGarage = ({tile, mqtt, useMqtt, useMqttSub}) => {

    const device_state = useSelector(state => state.DeviceController.data[tile.id], shallowEqual) || {}
    const mqtt_client = useMqtt()
    const events = device_state[mqtt['events']]?.params
    const init_state = device_state[`${tile.id}/rpc`]?.result
    const [isOpen, setIsOpen] = useState(false)
    const [isOpening, setIsOpening] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const is_open_txt = isOpen ? 'Open': 'Closed'
    const style = isOpen ? { color: '#f59598' }: {}

    if(events === undefined && init_state && 'state' in init_state) {
        if(init_state.state === false) {
            !isOpen && setIsOpen(true)
        }   
        if(init_state.state === true) {
            isOpen && setIsOpen(false)
        }   
    }
 
    if(events && 'input:0' in events) {
        if(events['input:0'].state === false) {
            !isOpen && setIsOpen(true)
        }
        if(events['input:0'].state === true) {
            isOpen && setIsOpen(false)
            isClosing && setIsClosing(false)
        }
    }

    if(events && 'switch:0' in events) {
        if(isOpen && events['switch:0'].output === true) {
            !isClosing && setIsClosing(true)
        }
        if(!isOpen && events['switch:0'].output === true) {
            !isOpening && setIsOpening(true)
        }
    }
 
    useMqttSub(mqtt_client, mqtt['events'], tile.id)
    useMqttSub(mqtt_client, `${tile.id}/rpc`, tile.id)

    useEffect(() => {
        if(isOpening) {
            setTimeout(() => {
                isOpening && setIsOpening(false)
            }, 15000)
        }
    }, [isOpening])

    useEffect(() => {
        if(mqtt_client && 'publish' in mqtt_client) {
            mqtt_client.publish(mqtt['state'], `{"id":0, "src":"${tile.id}", "method":"Input.GetStatus", "params":{"id":0}}`)
        }
    }, [mqtt_client])

    const handleClick = () => {
        mqtt_client.publish(mqtt['state'], `{"id":0, "src":"notused", "method":"Switch.Toggle", "params":{"id":0}}`)
    }

    if(isOpening || isClosing) {

        const door_state = isOpening ? 'Opening': 'Closing'

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
                    className="material-icons f125 pointer"
                >sensor_door</span>
            </div>
            <div style={style}>{is_open_txt}</div>
        </div>
    )
}

export default Shelly1PlusGarage