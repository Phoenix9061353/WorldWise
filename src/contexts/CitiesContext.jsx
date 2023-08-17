import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from 'react';

const BASE_URL = 'http://localhost:8000';

const CitiesContext = createContext();

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: '',
};

//因為這個例子中牽扯到 data fetching，所以就不像以前一樣用reducer完全處理了
function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return { ...state, isLoading: true };
    case 'cities/loaded':
      return { ...state, isLoading: false, cities: action.payload };
    case 'city/loaded':
      return { ...state, isLoading: false, currentCity: action.payload };
    case 'city/created':
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };
    case 'city/deleted':
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };
    case 'rejected':
      return { ...state, isLoading: false, error: action.payload };
    default:
      throw new Error('Unknown action type!');
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState
  );

  //取得API中所有城市的資料
  useEffect(function () {
    async function fetchCities() {
      dispatch({ type: 'loading' });
      try {
        const res = await fetch(`${BASE_URL}/cities`);
        const data = await res.json();
        dispatch({ type: 'cities/loaded', payload: data });
      } catch (err) {
        dispatch({
          type: 'rejected',
          payload: 'There is an error with loading cities!',
        });
      }
    }
    fetchCities();
  }, []);

  //取得指定城市的資料
  const getCity = useCallback(
    async function getCity(id) {
      //如果重複按壓相同城市 -> return 以避免不必要的API呼叫
      if (Number(id) === currentCity.id) return;

      dispatch({ type: 'loading' });
      try {
        const res = await fetch(`${BASE_URL}/cities/${id}`);
        const data = await res.json();
        dispatch({ type: 'city/loaded', payload: data });
      } catch (err) {
        dispatch({
          type: 'rejected',
          payload: 'There is an error with loading city!',
        });
      }
    },
    [currentCity.id]
  );

  //加城市資料進API資料中
  async function createCity(newCity) {
    dispatch({ type: 'loading' });
    try {
      //post request to update server state
      const res = await fetch(`${BASE_URL}/cities`, {
        method: 'POST',
        body: JSON.stringify(newCity),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      //同時更新state反應至畫面上
      dispatch({ type: 'city/created', payload: data });
    } catch (err) {
      dispatch({
        type: 'rejected',
        payload: 'There is an error with creating city!',
      });
    }
  }

  //刪除指定城市資料
  async function deleteCity(id) {
    dispatch({ type: 'loading' });
    try {
      //post request to update server state
      await fetch(`${BASE_URL}/cities/${id}`, {
        method: 'DELETE',
      });

      //同時更新state反應至畫面上
      dispatch({ type: 'city/deleted', payload: id });
    } catch (err) {
      dispatch({
        type: 'rejected',
        payload: 'There is an error with delete city!',
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        getCity,
        createCity,
        deleteCity,
        error,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined)
    throw new Error('CitiesContext was used outside of the Provider!');
  return context;
}

export { CitiesProvider, useCities };
