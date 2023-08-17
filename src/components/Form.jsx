// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"

import { useEffect, useState } from 'react';

//日曆
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import styles from './Form.module.css';
import Button from './Button';
import ButtonBack from './ButtonBack';
import Message from './Message';
import Spinner from './Spinner';
import { useUrlPosition } from '../hooks/useUrlPosition';
import { useCities } from '../contexts/CitiesContext';
import { useNavigate } from 'react-router-dom';

//接收country code變為國旗符號
export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

//依position得到地點資料
const BASE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

function Form() {
  const [cityName, setCityName] = useState('');
  const [country, setCountry] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [emoji, setEmoji] = useState('');
  const [geocodingError, setGeocodingError] = useState('');

  const [isLoadingGeolocation, setIsLoadingGeolocation] = useState(false);
  const [lat, lng] = useUrlPosition();
  const { createCity, isLoading } = useCities();
  const navigate = useNavigate();

  //render時依照 URL來fetch資料
  useEffect(
    function () {
      //當 URL裡沒有資料時直接return(防止使用者直接透過URL叫出表單)
      if (!lat && !lng) return;
      async function fetchCityData() {
        try {
          setIsLoadingGeolocation(true);
          setGeocodingError('');
          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();

          //如果點擊到的地方不是城市 -> 丟錯誤提醒使用者換地點
          if (!data.countryCode)
            throw new Error(
              "That doesn't seem to be a country. Click somewhere else🥲"
            );

          setCityName(data.city || data.locality || '');
          setCountry(data.countryName);
          setEmoji(convertToEmoji(data.countryCode));
        } catch (err) {
          setGeocodingError(err.message);
        } finally {
          setIsLoadingGeolocation(false);
        }
      }
      fetchCityData();
    },
    [lat, lng]
  );

  async function handleSubmit(e) {
    e.preventDefault();

    //沒有城市名或日期 -> return
    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };

    await createCity(newCity);
    navigate('/app/cities');
  }

  //如果正在fetching data -> 顯示spinner
  if (isLoadingGeolocation) return <Spinner />;

  //如果沒有lat和lng -> 顯示訊息
  if (!lat && !lng)
    return <Message message='Start by clicking somewhere on the map' />;

  //如果fetching 資料有錯誤 -> 顯示錯誤訊息
  if (geocodingError) return <Message message={geocodingError} />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ''}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor='cityName'>City name</label>
        <input
          id='cityName'
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor='date'>When did you go to {cityName}?</label>
        <DatePicker
          id='date'
          onChange={(date) => setDate(date)}
          selected={date}
          dateFormat='dd/MM/yyyy'
        />
      </div>

      <div className={styles.row}>
        <label htmlFor='notes'>Notes about your trip to {cityName}</label>
        <textarea
          id='notes'
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type='primary'>Add</Button>
        <ButtonBack />
      </div>
    </form>
  );
}

export default Form;
