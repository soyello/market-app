import { Map, MapMarker } from 'react-kakao-maps-sdk';

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  setCustomValue?: (id: string, value: number) => void;
  detailPage?: boolean;
}

const KakaoMap = ({
  latitude, // 기본 좌표 설정
  longitude,
  setCustomValue,
  detailPage = false,
}: KakaoMapProps) => {
  const handleClick = (mouseEvent: kakao.maps.event.MouseEvent) => {
    if (detailPage) return;
    setCustomValue!('latitude', mouseEvent.latLng.getLat());
    setCustomValue!('longitude', mouseEvent.latLng.getLng());
  };
  return (
    <Map
      center={{ lat: latitude, lng: longitude }}
      style={{ width: '100%', height: '360px' }}
      onClick={(_, mouseEvent) => handleClick(mouseEvent as kakao.maps.event.MouseEvent)}
    >
      <MapMarker position={{ lat: latitude, lng: longitude }}>
        <div style={{ color: '#000' }}>행복하다!</div>
      </MapMarker>
    </Map>
  );
};
export default KakaoMap;
