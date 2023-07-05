import { StyleSheet, View, Pressable, Text } from 'react-native';
import axios from 'axios';

import ble from './BLE';
import useEncryption from '../hooks/useEncryption';

//const {requestPermissions, scanForDevices} = ble();


export default function Button({ label,  theme, userID }) {
  const [plainText, cipherText, encryptData, decryptData] = useEncryption();

 
  if (theme === "authentication") {
    return (
      <View
      style={[styles.buttonContainer, { borderWidth: 4, borderColor: "#ffd33d", borderRadius: 18 }]}
      >
        <Pressable
          style={[styles.button, { backgroundColor: "#fff" }]}
          
          onPress={() => {
            ble.requestPermissions()
          }}>
          <Text style={[styles.buttonLabel, { color: "#25292e" }]}>{label}</Text>
        </Pressable>
    </View>
    );
  }

  if (theme === "encrypt") {
    return (
      <View style={styles.buttonContainer}>
              <Pressable style={styles.button} onPress={ () =>
              encryptData('112233445566778899aabbccddeeff00')}>
                <Text style={styles.buttonLabel}>{label}</Text>
              </Pressable>
            </View>
        );
  }

  if (theme === "decrypt") {
    return (
      <View style={styles.buttonContainer}>
              <Pressable style={styles.button} onPress={ () =>
              decryptData('572df63be8b2bbc8b3535dc7a56c640d')}>
                <Text style={styles.buttonLabel}>{label}</Text>
              </Pressable>
            </View>
        );
  }

  return (
    <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={ () =>
        alert('Button pressed')}>
          <Text style={styles.buttonLabel}>{label}</Text>
        </Pressable>
      </View>
  );
}

const styles = StyleSheet.create({
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
});
