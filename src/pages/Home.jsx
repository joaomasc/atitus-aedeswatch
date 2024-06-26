import React, { useState, useEffect, useContext } from "react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { UserContext } from "../context/UserContext";
import logo from "../assets/img/logo.png";

export function Home() {
  const [markers, setMarkers] = useState([]);
  const [newRegister, setNewRegister] = useState(false);

  const containerStyle = {
    width: "100%",
    height: "100%",
  };

  const [center, setCenter] = useState({
    lat: -3.745,
    lng: -38.523,
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyA63DHP_zR7arJm9jkcY9rl881YhlfHL44", // Coloque sua chave de API do Google Maps aqui
  });

  const [map, setMap] = useState(null);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const location = window.navigator && window.navigator.geolocation;

    const locationSuccess = (position) => {
      setCenter({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    };

    const locationError = () => {
      console.log("Não foi possível obter a localização atual.");
      setCenter({
        lat: -28.2624,
        lng: -52.396032,
      });
    };

    if (location) {
      location.getCurrentPosition(locationSuccess, locationError);
    } else {
      console.log("Geolocalização não suportada pelo navegador.");
      setCenter({
        lat: -28.2624,
        lng: -52.396032,
      });
    }
  }, []);

  useEffect(() => {
    fetch("https://denguealerta202401-production.up.railway.app/ws/foco", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar os marcadores.");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const newMarkerArray = data.map(({ latitude, longitude }) => ({
            lat: latitude,
            lng: longitude,
          }));
          setMarkers(newMarkerArray);
        } else {
          throw new Error("Formato de dados inválido.");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [user.token]);

  const onLoad = React.useCallback(
    function callback(map) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(center);
      map.fitBounds(bounds);
      setMap(map);
    },
    [center]
  );

  const handleMapClick = (event) => {
    const confirmRegister = window.confirm(
      "Você deseja cadastrar um ponto de foco aqui?"
    );
    if (!confirmRegister) return;

    const newMarker = {
      latitude: event.latLng.lat(),
      longitude: event.latLng.lng(),
      descricao: "", // Adicione os campos necessários, como "descricao"
      local: "", // Adicione os campos necessários, como "local"
      cpf: "", // Adicione os campos necessários, como "cpf"
    };

    fetch("https://denguealerta202401-production.up.railway.app/ws/foco", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(newMarker),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao adicionar marcador.");
        }
        return response.json();
      })
      .then(() => {
        // Atualiza os marcadores com o novo marcador adicionado
        setMarkers((prevMarkers) => [
          ...prevMarkers,
          { lat: newMarker.latitude, lng: newMarker.longitude },
        ]);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleCloseRegister = () => {
    setNewRegister(false);
  };

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <img src={logo} width="120" className="mb-5" />
        {newRegister && (
          <div className="addMarkerDialog">
            <p>Cadastrar:</p>
            <form>
              <input
                type="text"
                className="input mb-5"
                name="descricao"
                required
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button type="submit" className="btn mb-5">
                  Cadastrar
                </button>
                <a href="#" onClick={() => setNewRegister(false)}>
                  Fechar
                </a>
              </div>
            </form>
          </div>
        )}
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
          >
            <Marker position={center} />
            {markers.map((marker, index) => (
              <Marker key={index} position={marker} />
            ))}
          </GoogleMap>
        ) : (
          <p>Carregando o mapa...</p>
        )}
      </main>
      <Footer />
    </>
  );
}
