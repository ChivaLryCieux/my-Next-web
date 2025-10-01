"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 类型定义 ---
// 1. 扩展 Leaflet 的 GeoJSON 类型
declare module 'leaflet' {
    interface GeoJSON {
        selectedLayer?: L.Layer | null;
    }
}

// 2. 为 GeoJSON 的 feature properties 定义接口，增强类型安全
interface IFeatureProperties {
    adcode?: number;
    name?: string;
}

// 3. 为地点配置定义接口
interface ILocation {
    id: 'global' | 'china' | 'zunyi' | 'yangpu';
    label: string;
    coords: LatLngExpression;
    zoom: number;
    areaCode?: number;
}

// --- 样式与常量 ---
const defaultStyle = (): L.PathOptions => ({
    fillColor: 'transparent',
    weight: 1,
    opacity: 1,
    color: '#333',
    fillOpacity: 0,
});

const highlightStyle = (): L.PathOptions => ({
    fillColor: '#ff0000',
    weight: 2,
    opacity: 1,
    color: '#000',
    fillOpacity: 0.7,
});

// 4. 将地点配置数据结构化，实现数据与视图分离
const locations: ILocation[] = [
    { id: 'global', label: '全球', coords: [35.0, 105.0], zoom: 2 },
    { id: 'china', label: '中国', coords: [35.8617, 104.1954], zoom: 4 },
    { id: 'zunyi', label: '遵义', coords: [27.7274, 106.9723], zoom: 6, areaCode: 520300 },
    { id: 'yangpu', label: '杨浦', coords: [31.2626, 121.5369], zoom: 8, areaCode: 310110 },
];

// 5. 按钮样式复用
const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'bei, sans-serif',
};


const MapComponent: React.FC<{ className?: string }> = ({ className = '' }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const geojsonRef = useRef<L.GeoJSON | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(true);

    // 6. 使用 useCallback 优化事件处理函数
    const handleLocationClick = useCallback((location: ILocation) => {
        const map = mapRef.current;
        const geojson = geojsonRef.current;
        if (!map || !geojson) return;

        geojson.setStyle(defaultStyle());
        geojson.selectedLayer = null;

        if (location.id !== 'global') {
            geojson.eachLayer((layer: L.Layer & { feature?: GeoJSON.Feature<GeoJSON.Geometry, IFeatureProperties> }) => {
                const adcode = layer.feature?.properties?.adcode;
                if (!adcode) return;

                // 'china' 时高亮所有区域，否则按 areaCode 匹配
                if (location.id === 'china' || adcode === location.areaCode) {
                    (layer as L.Path).setStyle(highlightStyle());
                    geojson.selectedLayer = layer;
                }
            });
        }

        map.flyTo(location.coords, location.zoom, { duration: 1.2 });
    }, []); // 依赖项为空，此函数只创建一次

    // 地图初始化和数据加载 effect
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return; // 防止重复初始化

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            attributionControl: false,
        }).setView([35.8617, 104.1954], 4);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
            maxZoom: 18,
            noWrap: false,
        }).addTo(map);

        mapRef.current = map;

        const loadGeoJSON = async () => {
            try {
                const response = await fetch('/cn.json');
                if (!response.ok) throw new Error('加载地图数据失败');
                const geoData = await response.json();

                const geojson = L.geoJson(geoData, {
                    style: defaultStyle,
                    onEachFeature: (feature: GeoJSON.Feature<GeoJSON.Geometry, IFeatureProperties>, layer) => {
                        (layer as L.Layer & { feature?: GeoJSON.Feature<GeoJSON.Geometry, IFeatureProperties> }).feature = feature; // 保持 feature 引用
                        layer.on({
                            mouseover: () => {
                                if (!geojsonRef.current?.selectedLayer) {
                                    (layer as L.Path).setStyle({ weight: 2, color: '#666' });
                                }
                            },
                            mouseout: () => {
                                if (!geojsonRef.current?.selectedLayer) {
                                    geojsonRef.current?.setStyle(defaultStyle);
                                }
                            }
                        });
                    },
                }).addTo(map);

                geojsonRef.current = geojson;
            } catch (error) {
                console.error('地图数据加载错误:', error);
            }
        };

        loadGeoJSON();

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // IntersectionObserver effect
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsMapVisible(entry.isIntersecting && entry.intersectionRatio > 0.5),
            { threshold: 0.5 }
        );

        const currentRef = mapContainerRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return (
        <div
            className={`map-wrapper ${className}`}
            style={{
                width: '100%', height: '100vh', padding: '5vw',
                backgroundColor: '#000', boxSizing: 'border-box',
                overflow: 'hidden', position: 'relative',
            }}
        >
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', backgroundColor: '#fff' }} />

            {isMapVisible && (
                <div style={{
                    position: 'absolute', top: '5vw', left: '5vw', zIndex: 1000,
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    animation: 'fadeIn 0.5s ease-out forwards',
                }}>
                    {/* 7. 通过映射数据动态生成按钮 */}
                    {locations.map((location) => (
                        <button
                            key={location.id}
                            onClick={() => handleLocationClick(location)}
                            style={buttonStyle}
                        >
                            {location.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MapComponent;