import { useState, useEffect } from 'react';
import axios from 'axios';

import BLE from '../components/BLE';

const ipAddress = '10.93.11.8';

const useUser = () => {
  const [userName, setUserName] = useState('');
  const [userID, setUserID] = useState('');

  useEffect(() => {
    if (userName !== '') {
      axios.get(`http://${ipAddress}:8080/userExist?data=${userName}`)
        .then(response => {
          if(response.data){
            axios.get(`http://${ipAddress}:8080/getUserID?data=${userName}`)
            .then(response => {
              setUserID(response.data);
              BLE.setUserID(response.data);
              console.log('UserID : ' + response.data);
            })
            .catch(error => {
              console.error(error);
            });
          } else {
            setUserID('');
          }
        });
    }
  }, [userName]);

  const onChangeUserName = (value) => {
    setUserName(value);
  };

  return [userName, onChangeUserName, userID];
};

export default useUser;


