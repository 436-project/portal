import { LoaderCircle } from 'lucide-react';
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FlightContext } from '@/App';
import { Preferences } from '@/components/Preferences';
import { PreferencesType } from '@/components/types';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ComboBox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/datepicker';
import airports from '@/data/airports.json';

import styles from './Search.module.scss';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const { flights, setFlights } = useContext(FlightContext);
  const { preferences, setPreferences } = useContext(FlightContext);
  const { googleFlightsURL, setGoogleFlightsURL } = useContext(FlightContext);

  // Airports
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [airportError, setAirportError] = useState<boolean>(false);

  const handleOriginChange = (newValue: string) => {
    setAirportError(newValue === destination);
    setOrigin(newValue);
  };

  const handleDestinationChange = (newValue: string) => {
    setAirportError(newValue === origin);
    setDestination(newValue);
  };

  // Dates
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [dateError, setDateError] = useState<boolean>(false);

  const handleDepartureDateChange = (newDate: Date) => {
    setDepartureDate(newDate);
    if (returnDate && newDate > returnDate) {
      setDateError(true);
    } else {
      setDateError(false);
    }
  };

  const handleReturnDateChange = (newDate: Date) => {
    setReturnDate(newDate);
    if (departureDate && newDate < departureDate) {
      setDateError(true);
    } else {
      setDateError(false);
    }
  };

  const handlePreferencesChange = (newPreferences: PreferencesType) => {
    setPreferences(newPreferences);
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGetFlights = async () => {
    const apiUrl = 'http://127.0.0.1:5000/api/search';
    const params = new URLSearchParams({
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departureDate?.toISOString().split('T')[0] || '',
      return_date: returnDate?.toISOString().split('T')[0] || '',
    });

    setIsLoading(true);
    setFlights([]);

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching flights:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreFlights = async (flightData: any) => {
    const apiUrl = 'http://127.0.0.1:5000/api/score';
    const params = new URLSearchParams({
      flight_data: JSON.stringify(flightData),
      cost_preference: preferences?.costPreference.toString() || '0',
      duration_preference: preferences?.durationPreference.toString() || '0',
      redeye_preference: preferences?.redeyePreference.toString() || '0',
    });

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error scoring flights:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const flightData = await handleGetFlights();
    if (flightData) {
      const scoredData = await handleScoreFlights(flightData.flight_data);
      if (scoredData) {
        setFlights(scoredData.flights);
        setGoogleFlightsURL(flightData.google_flights_url);
        navigate('/results');
      }
    }
  };

  // Button enabled state
  const isButtonEnabled =
    origin && destination && departureDate && !airportError && !dateError;

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>
          <Typography variant="extra-large" color="#4F4F4F">
            Where are you flying?
          </Typography>
        </CardTitle>
        <CardContent className={styles.cardContent}>
          <div className={styles.searchInput}>
            <Typography variant="small" color="#549CDE">
              From
            </Typography>
            <ComboBox combos={airports} onValueChange={handleOriginChange} />
            {airportError && (
              <Typography variant="tiny" color="#FF6347">
                Origin and destination airports cannot be the same.
              </Typography>
            )}
          </div>
          <div className={styles.searchInput}>
            <Typography variant="small" color="#549CDE">
              To
            </Typography>
            <ComboBox
              combos={airports}
              onValueChange={handleDestinationChange}
            />
          </div>
          <div className={styles.searchInput}>
            <Typography variant="small" color="#549CDE">
              Depart
            </Typography>
            <DatePicker onDateChange={handleDepartureDateChange} />
          </div>
          <div className={styles.searchInput}>
            <Typography variant="small" color="#549CDE">
              Return
            </Typography>
            <DatePicker onDateChange={handleReturnDateChange} />
            {dateError && (
              <Typography variant="tiny" color="#FF6347">
                Return date cannot be before departure date.
              </Typography>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className={styles.cardFooter}>
            <Preferences onPreferencesChange={handlePreferencesChange} />
            <Button
              className={styles.primaryButton}
              onClick={handleSubmit}
              disabled={!isButtonEnabled || isLoading}
            >
              {isLoading ? (
                <LoaderCircle className={styles.loader} />
              ) : (
                <Typography variant="small">Show Flights</Typography>
              )}
            </Button>
          </div>
        </CardFooter>
      </CardHeader>
    </Card>
  );
};
