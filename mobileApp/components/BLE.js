import React, { useState } from 'react';
import { Alert,Text, View, StyleSheet,PermissionsAndroid, Pressable, FlatList} from 'react-native';

import { BleManager, Characteristic, Device } from "react-native-ble-plx";

import { Buffer } from 'buffer';

import axios from 'axios';

import base64 from 'react-native-base64'

const bleManager = new BleManager();

const ipAddress = '192.168.137.1';

const CARD_ID_UUID_CHARAC = '495f449c-fc60-4048-b53e-bdb3046d4495';
const CARD_ID_UUID_SERVICE = '5a44c004-4112-4274-880e-cd9b3daedf8e';

var userID = '';
var connectedDevice;
var modifiedCharac;
var randNum;

const States = {
    ST_OnIdle: 'ST_OnIdle',
    ST_StartAuthentication: 'ST_StartAuthentication',
    ST_DeviceAuthentication: 'ST_DeviceAuthentication',
    ST_WaitDeviceAuthentication: 'ST_WaitDeviceAuthentication',
    ST_DeviceAuthenticated: 'ST_DeviceAuthenticated',
    ST_WaitDeviceRandNum: 'ST_WaitDeviceRandNum',
    ST_AppAuthentication: 'ST_AppAuthentication',
    ST_WaitAppAuthentication: 'ST_WaitAppAuthentication',
    ST_AppAuthenticated: 'ST_AppAuthenticated',
    ST_Authenticated: 'ST_Authenticated',
    ST_AuthenticationFailed: 'AuthFailed'
  };

var currentState = States.ST_OnIdle;

const BLE = () => {
    const [printedText, setPrintedText] = useState('');
    const [discoveredDeviceList, setDiscoveredDeviceList] = useState([]);

    
    const addDevice = (device) => {
        setDiscoveredDeviceList(prevDeviceList => [...prevDeviceList, device]);  
        sortDeviceList();             
    };

    const sortDeviceList = () => {
        setDiscoveredDeviceList(prevDeviceList => [...prevDeviceList].sort((a, b) => b.rssi - a.rssi));
    }

    const updateDevice = (updatedDevice) => {
        const updatedDeviceList = discoveredDeviceList.map(device => {
          if (device.id === updatedDevice.id) {
            return { ...device, ...updatedDevice };
          }
          return device;
        });
        setDiscoveredDeviceList(updatedDeviceList);
        sortDeviceList();
    };

    const clearDeviceList = () => {
        setDiscoveredDeviceList([]);
    };

    alreadyDiscover = (device) => {
        var exist = false;

        for (var i = 0; i < discoveredDeviceList.length; i++) {
            if (discoveredDeviceList[i].id === device.id) {
                updateDevice(device);
                //console.log('Device updated : ', device.name, ' (' , device.id, '), RSSI = ', device.rssi);
                exist = true;
                break; 
            }
        }
        return exist;
    };
    
    const onNotificationReceived = (
        error: BleError | null,
        characteristic: Characteristic | null,
      ) => {
        if (error) {
            //console.log('Error notification (charachteristic : ' + characteristic.uuid + ')'); 
            if(currentState != States.ST_OnIdle) {
                console.log(error);

                currentState = States.ST_AuthenticationFailed;
                authenticationControler();
            }
  
        } else if (!characteristic?.value) {
            //console.log('Notification (charachteristic : ' + characteristic.uuid + ') received with no data');
        } else {
            //console.log('Notification received (charachteristic : ' + characteristic.uuid + ') : ' + Buffer.from(characteristic.value, 'base64').toString('hex'));
            modifiedCharac = Buffer.from(characteristic.value, 'base64').toString('hex');

            switch(currentState) {
                case States.ST_WaitDeviceAuthentication:
                    currentState = States.ST_DeviceAuthentication;
                break;

                case States.ST_WaitDeviceRandNum:
                    currentState = States.ST_AppAuthentication;
                    break;
    
                case States.ST_WaitAppAuthentication:
                    currentState = States.ST_AppAuthenticated;
                    break;

                default:
                    break;
            }
            authenticationControler();
        }
      };

    requestPermissions = async () => {
        const grantedStatus = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location Permission',
                message: 'Bluetooth Low Energy Needs Location Permission',
                buttonNegative: 'Cancel',
                buttonPositive: 'Ok',
                buttonNeutral: "Maybe Later"
            },
        );
        await PermissionsAndroid.requestMultiple([ PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT])
        if(grantedStatus == PermissionsAndroid.RESULTS.GRANTED){
            await scanForDevices();
        } else {
            console.log('Error : Permission not granted.');
            Alert.alert('Permission not granted !');
        }
    };

    scanForDevices = async () => {
        if(userID !== '' && currentState === States.ST_OnIdle){
            console.log("Start scanning...");
            setPrintedText('Discovering ...');

            bleManager.startDeviceScan(null, null, (error, device) => {
                if(error) {
                    console.log('Error scanning for devices : ', error);
                } 
                if (device && device.serviceUUIDs && (device.serviceUUIDs).includes(CARD_ID_UUID_SERVICE)){
                    if(alreadyDiscover(device) === false){
                        console.log('Device found : ', device.name, ' (' , device.id, '), RSSI = ', device.rssi);
                        addDevice(device);
                    } else if (device.rssi >= -40){
                        connectToDevice(device);
                    }
                }
            });
        } else {
            Alert.alert('Enter a valid user name.');
        }
    };

    connectToDevice = async (device) => {
        try {
            bleManager.stopDeviceScan();
            console.log('Stop scanning.');
            if(await bleManager.connectToDevice(device.id)){
                connectedDevice = device;

                setPrintedText(connectedDevice.name + ' connected (' + connectedDevice.id + ')');
                await connectedDevice.discoverAllServicesAndCharacteristics();
    
                console.log('Enable monitor notification.');
                await connectedDevice.monitorCharacteristicForService(CARD_ID_UUID_SERVICE, CARD_ID_UUID_CHARAC, (error, characteristic) => onNotificationReceived(error, characteristic));
                
                currentState = ST_WaitAuthentication;
                authenticationControler(connectedDevice);  
            } else {
                Alert.alert('Authentication failed !');
                console.log('Connection failed !');
            }
            
        } catch (e) {
            console.log('FAILED TO CONNECT :', e);
        }
    };

    const getRandomNum = async() => {
        try {
            const response = await axios.get(`http://${ipAddress}:8080/getRandNum`);
            randNum = response.data.randNum;
            
            console.log('App random number: ' + randNum);
            return randNum;
        } catch (error) {
            console.error(error);
            currentState = States.ST_AuthenticationFailed;
        }
    };

    const getDecryptedData = async(data) => {
        try {
            const response = await axios.get(`http://${ipAddress}:8080/getDecryptData?data=${data}`);
            const decryptData = response.data.decryptedData;

            console.log('Decrypted data : ' + decryptData);
            return decryptData;
        } catch (error) {
            console.error(error);
            currentState = States.ST_AuthenticationFailed;
        }
    };

    const getEncryptedData = async(data) => {
        try {
            const response = await axios.get(`http://${ipAddress}:8080/getEncryptData?data=${data}`);
            const encryptData = response.data.encryptedData;

            console.log('Encrypted data : ' + encryptData);
            return encryptData;
        } catch (error) {
            console.error(error);
            currentState = States.ST_AuthenticationFailed;
        }
    };
    
    const authenticationControler = async() => {
        while(true){
            switch(currentState) {
                case States.ST_StartAuthentication:
                    console.log('Authentication protocol started...');
                    if(await sendValue(await getRandomNum())){
                        currentState = States.ST_WaitDeviceAuthentication;
                        return;
                    } else {
                        currentState = States.ST_AuthenticationFailed;
                    }
                    break;

                case States.ST_DeviceAuthentication:
                    if(randNum === await getDecryptedData(modifiedCharac)) {
                        console.log('Device authenticate');
                        currentState = States.ST_DeviceAuthenticated;
                    } else{
                        currentState = States.ST_AuthenticationFailed;
                    }
                    break;

                case States.ST_DeviceAuthenticated:
                    if(await sendValue(await getRandomNum())){;
                        currentState = States.ST_WaitDeviceRandNum;
                        return;
                    } else {
                        currentState = States.ST_AuthenticationFailed;
                    }
                    break;

                case States.ST_AppAuthentication:
                    console.log('Device random number : ' + modifiedCharac);
                    if(await sendValue(await getEncryptedData(modifiedCharac))){;
                        currentState = States.ST_WaitAppAuthentication;
                        return;
                    } else {
                        currentState = States.ST_AuthenticationFailed;
                    }
                    break;

                case States.ST_AppAuthenticated:
                    if(await sendValue(userID)){;
                        currentState = States.ST_Authenticated;
                    } else {
                        currentState = States.ST_AuthenticationFailed;
                    }
                break;

                case States.ST_Authenticated:
                    Alert.alert('User ID successfully sent to the card reader !');
                    console.log('Authentication done, ID send !');
                    disconnectFromDevice(connectedDevice);

                    currentState = States.ST_OnIdle;
                    return;
    
                case States.ST_AuthenticationFailed:
                    Alert.alert('Authentication failed !');
                    console.log('Authentication failed !');
                    disconnectFromDevice(connectedDevice)
                    return;

                default:
                    break;
            }
        }
           
    };

    const sendValue = async (value) => {
        try {
            const response = await bleManager.writeCharacteristicWithResponseForDevice(connectedDevice.id, CARD_ID_UUID_SERVICE, CARD_ID_UUID_CHARAC, base64.encode(value.toString()));
            if(value.toString() === base64.decode(response.value).toString()) {
                //console.log('Value send : ', value);  
                return true;
            } else {
                console.log('Value send failed: ', value);
                return false;
            }  
        } catch (e) {
            console.log('FAILED TO SEND VALUE :', e);3
            return false;
        }
    };

    const disconnectFromDevice = () => {
        try {
            bleManager.cancelDeviceConnection(connectedDevice.id);
            clearDeviceList();
            currentState = States.ST_OnIdle;

            console.log('Device disconnected : ' + connectedDevice.name);
            setPrintedText('');
        } catch (e) {
            console.log('FAILED TO DISCONNECT :', e);
        }    
    };          

    const Item = ({title, id}) => (
        <View style={[styles.item, discoveredDeviceList[0].id == id && styles.itemSelected]}>
          <Text style={styles.itemText}>{title}</Text>
        </View>
    );

    return (
        <><View style={styles.container}>
        <Text style={styles.itemTitle}>{discoveredDeviceList.length === 0 ? null : 'Discovered devices'}</Text>
        <View style={styles.containerFlatlist}>
            <FlatList
                data={discoveredDeviceList}
                renderItem={({item}) => <Item title={item.name + ' (' + item.id + ')'} id={item.id} />}
                keyExtractor={item => item.id}
            />
        </View>    
        <View>
         <Text style={styles.message}>{discoveredDeviceList.length === 0 ? null : 'Approach the smartphone to the reader.'}</Text>
        </View>
        <View style={[styles.buttonContainer, { borderWidth: 4, borderColor: "#ffd33d", borderRadius: 18 }]}>
            <Pressable
                style={[styles.button, { backgroundColor: "#fff" }]}
                onPress={() => {
                    if(userID !== ''){
                        requestPermissions();
                    } else {
                        Alert.alert('Select a user !')
                    }
                } }>
                <Text style={[styles.buttonLabel, { color: "#25292e" }]}>{'Discover devices' }</Text>
            </Pressable>
            
        </View>
        <View>
         <Text style={styles.text}>{printedText}</Text>
         </View>
     </View></>
    );

};

BLE.setUserID = (id) => {
    userID = id;
};

export default BLE;

const styles = StyleSheet.create({
    container: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,

    }, 
    containerFlatlist: {
        flex: 1,
        marginBottom: 20,
    }, 
    item: {
        padding: 8,
        backgroundColor: '#404040',
        marginBottom: 5,
        marginVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
      },
    itemSelected: {
        padding: 8,
        backgroundColor: '#7390ad',
        marginBottom: 5,
        marginVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
    },
    itemText: {
        color: '#fff',
        fontSize: 16,
        marginHorizontal: 10,
    },
    itemTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: 320,
        height: 68,
        marginHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
    },
    button: {
        borderRadius: 10,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonIcon: {
        paddingRight: 8,
    },
    buttonLabel: {
        color: '#fff',
        fontSize: 20,
    },
    text: {
        fontSize: 16,
        marginTop: 10,
    },
    message: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 15,
    },
      
})