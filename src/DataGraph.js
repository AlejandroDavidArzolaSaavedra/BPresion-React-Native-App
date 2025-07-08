import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LineGraph } from 'react-native-graph';
import { Line } from 'react-native-svg';
import { Circle } from '@shopify/react-native-skia';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useTensionStore from '../zustand/tensionStore';

const CustomSelectionDot = ({ isActive, color, circleX, circleY, isTouching }) => {
  return (isActive && isTouching && circleX != null && circleY != null) ? (
    <Circle cx={circleX} cy={circleY} r={5} color={color} />
  ) : null;
};

const AxisLabel = ({ date, systolic, diastolic, position, showDiastolic }) => {
  const formattedDate = date.toLocaleDateString('es-ES', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return (
    <View style={[
      styles.axisLabel, 
      position === 'top' ? styles.topLabel : styles.bottomLabel
    ]}>
      <Text style={styles.axisLabelText}>
        {showDiastolic ? diastolic : systolic}/{showDiastolic ? systolic : diastolic} | {formattedDate}
      </Text>
    </View>
  );
};

const PressureIndicator = ({ systolic, diastolic }) => {
  if (systolic === null || diastolic === null) return null;
  
  let iconName, iconColor;
  
  if (systolic > 140 || diastolic > 90) {
    iconName = 'arrow-up';
    iconColor = '#E53935';
  } else if (systolic < 90 || diastolic < 60) {
    iconName = 'arrow-down';
    iconColor = '#1E88E5';
  } else {
    iconName = 'checkmark';
    iconColor = '#30a99e';
  }
  
  return (
    <View style={styles.pressureIndicator}>
      <Ionicons name={iconName} size={16} color={iconColor} />
    </View>
  );
};

const SelectionIndicator = ({ selectedPoint, isTouching, showDiastolic }) => {
  if (!selectedPoint || !isTouching) return null;

  const value = showDiastolic ? selectedPoint.diastolic : selectedPoint.systolic;
  const oppositeValue = showDiastolic ? selectedPoint.systolic : selectedPoint.diastolic;

  return (
    <>
      <Line
        x1="0%"
        y1={`${100 - ((value - 70) / 60) * 100}%`}
        x2="100%"
        y2={`${100 - ((value - 70) / 60) * 100}%`}
        stroke="rgba(120, 120, 120, 0.5)"
        strokeWidth={1}
        strokeDasharray="4 2"
      />
      <View style={[
        styles.selectionIndicator, 
        { 
          top: `${100 - ((value - 70) / 60) * 100}%`,
        }
      ]}>
        <View style={styles.selectionIndicatorValue}>
          <Text style={styles.selectionIndicatorText}>
            {showDiastolic ? oppositeValue.toFixed(0) : value.toFixed(0)}/
            {showDiastolic ? value.toFixed(0) : oppositeValue.toFixed(0)}
          </Text>
          <PressureIndicator systolic={selectedPoint.systolic} diastolic={selectedPoint.diastolic} />
        </View>
        <View style={styles.selectionIndicatorPoint} />
      </View>
    </>
  );
};

const RangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = [
    { id: 'day', label: 'Día' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: '3months', label: '3 Meses' }
  ];

  return (
    <View style={styles.rangeSelector}>
      {ranges.map(range => (
        <TouchableOpacity
          key={range.id}
          style={[
            styles.rangeButton,
            activeRange === range.id && styles.rangeButtonActive
          ]}
          onPress={() => onRangeChange(range.id)}
        >
          <Text style={[
            styles.rangeButtonText,
            activeRange === range.id && styles.rangeButtonTextActive
          ]}>
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const formatDateForRange = (date, range) => {
  if (range === 'day') {
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  } else {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: range === 'week' ? 'short' : 'numeric' 
    });
  }
};

const ToggleButton = ({ showDiastolic, onToggle }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.toggleButton,
        showDiastolic ? styles.toggleButtonDiastolic : styles.toggleButtonSystolic
      ]}
      onPress={onToggle}
    >
      <Text style={styles.toggleButtonText}>
        {showDiastolic ? 'Mostrar Sistólica' : 'Mostrar Diastólica'}
      </Text>
    </TouchableOpacity>
  );
};

const DataGraph = () => { 
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isTouching, setIsTouching] = useState(false);
  const [range, setRange] = useState('week');
  const [showDiastolic, setShowDiastolic] = useState(false);
  const { measurements, loadMeasurements } = useTensionStore();

  useEffect(() => {
    loadMeasurements();
  }, []);

  const points = useMemo(() => {
    return measurements.map(measurement => {
      try {
         const [day, month, year] = measurement.fecha.split('/');
        const [hours, minutes] = measurement.hora.split(':');
        
        if (!day || !month || !year || !hours || !minutes) {
          console.warn('Formato de fecha/hora inválido:', measurement.fecha, measurement.hora);
          return null;
        }
  
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
        
        if (isNaN(date.getTime())) {
          console.warn('Fecha inválida:', date);
          return null;
        }
        
        return {
          date,
          systolic: parseFloat(measurement.sistolica),
          diastolic: parseFloat(measurement.diastolica),
          pulsaciones: measurement.pulsaciones
        };
      } catch (error) {
        console.error('Error al parsear medición:', error);
        return null;
      }
    }).filter(point => point !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [measurements]);

  const filteredPoints = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch(range) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7);
    }
    
    return points.filter(point => point.date >= cutoffDate);
  }, [points, range]);

  const handleRangeChange = useCallback((newRange) => {
    setRange(newRange);
    setSelectedPoint(null);
    setIsTouching(false);
  }, []);

  const handlePointSelected = useCallback((point) => {
    if (!point || !point.date || isNaN(point.date.getTime())) {
      console.warn('Punto seleccionado inválido:', point);
      return;
    }
    setSelectedPoint(point);
    setIsTouching(true);
  }, []);

  const handleGestureEnd = useCallback(() => {
    setIsTouching(false);
  }, []);

  const toggleGraph = useCallback(() => {
    setShowDiastolic(prev => !prev);
    setSelectedPoint(null);
    setIsTouching(false);
  }, []);

  const { maxSystolicPoint, minSystolicPoint, maxDiastolicPoint, minDiastolicPoint } = useMemo(() => {
    if (filteredPoints.length === 0) return { 
      maxSystolicPoint: null, 
      minSystolicPoint: null,
      maxDiastolicPoint: null,
      minDiastolicPoint: null
    };
    
    let maxSystolicPoint = filteredPoints[0];
    let minSystolicPoint = filteredPoints[0];
    let maxDiastolicPoint = filteredPoints[0];
    let minDiastolicPoint = filteredPoints[0];
    
    filteredPoints.forEach(point => {
      if (point.systolic > maxSystolicPoint.systolic) maxSystolicPoint = point;
      if (point.systolic < minSystolicPoint.systolic) minSystolicPoint = point;
      if (point.diastolic > maxDiastolicPoint.diastolic) maxDiastolicPoint = point;
      if (point.diastolic < minDiastolicPoint.diastolic) minDiastolicPoint = point;
    });
    
    return { maxSystolicPoint, minSystolicPoint, maxDiastolicPoint, minDiastolicPoint };
  }, [filteredPoints]);

  const graphPoints = useMemo(() => {
    return filteredPoints.map(point => ({
      date: point.date,
      value: showDiastolic ? point.diastolic : point.systolic
    }));
  }, [filteredPoints, showDiastolic]);

  const secondaryGraphPoints = useMemo(() => {
    return filteredPoints.map(point => ({
      date: point.date,
      value: showDiastolic ? point.systolic : point.diastolic
    }));
  }, [filteredPoints, showDiastolic]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {selectedPoint && isTouching
              ? `Presión: ${showDiastolic ? selectedPoint.diastolic.toFixed(0) : selectedPoint.systolic.toFixed(0)}/${showDiastolic ? selectedPoint.systolic.toFixed(0) : selectedPoint.diastolic.toFixed(0)} (${formatDateForRange(selectedPoint.date, range)})`
              : 'Presión Arterial'}
          </Text>
          <Text style={styles.subtitle}>
            {range === 'day' ? 'Últimas 24 horas' : 
             range === 'week' ? 'Última semana' : 
             range === 'month' ? 'Último mes' : 'Últimos 3 meses'}
          </Text>
        </View>
        
        <RangeSelector activeRange={range} onRangeChange={handleRangeChange} />
        
        <ToggleButton showDiastolic={showDiastolic} onToggle={toggleGraph} />
        
        <View style={styles.graphContainer}>
          {filteredPoints.length > 0 ? (
            <LineGraph
              style={styles.graph}
              key={`${range}-${showDiastolic}`}
              points={graphPoints}
              animated={true}
              color={showDiastolic ? '#2196F3' : '#30a99e'}
              enablePanGesture={true}
              enableFadeInMask={true}
              gradientFillColors={showDiastolic ? ['#2196F380', '#2196F300'] : ['#30a99e80', '#30a99e00']}
              TopAxisLabel={() => (showDiastolic ? maxDiastolicPoint : maxSystolicPoint) && (
                <AxisLabel 
                  date={showDiastolic ? maxDiastolicPoint.date : maxSystolicPoint.date} 
                  systolic={maxSystolicPoint?.systolic.toFixed(0)}
                  diastolic={maxDiastolicPoint?.diastolic.toFixed(0)}
                  position="top"
                  showDiastolic={showDiastolic}
                />
              )}
              BottomAxisLabel={() => (showDiastolic ? minDiastolicPoint : minSystolicPoint) && (
                <AxisLabel 
                  date={showDiastolic ? minDiastolicPoint.date : minSystolicPoint.date} 
                  systolic={minSystolicPoint?.systolic.toFixed(0)}
                  diastolic={minDiastolicPoint?.diastolic.toFixed(0)}
                  position="bottom"
                  showDiastolic={showDiastolic}
                />
              )}
              SelectionDot={(props) => (
                <CustomSelectionDot {...props} isTouching={isTouching} />
              )}
              onPointSelected={(point) => {
                const fullPoint = filteredPoints.find(p => p.date.getTime() === point.date.getTime());
                handlePointSelected(fullPoint);
              }}
              onGestureEnd={handleGestureEnd}
              panGestureDelay={0}
              renderAdditionalGraphElements={() => (
                <>
                  <LineGraph
                    points={secondaryGraphPoints}
                    color={showDiastolic ? '#30a99e' : '#2196F3'}
                    animated={true}
                    enablePanGesture={false}
                    enableFadeInMask={false}
                    enableIndicator={false}
                    lineThickness={2}
                  />
                  
                  <SelectionIndicator 
                    selectedPoint={selectedPoint} 
                    isTouching={isTouching} 
                    showDiastolic={showDiastolic}
                  />
                </>
              )}
            />
          ) : (
            <View style={styles.emptyGraph}>
              <Text style={styles.emptyText}>No hay datos disponibles para el período seleccionado</Text>
            </View>
          )}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, {
              backgroundColor: '#30a99e' 
            }]} />
            <Text style={styles.legendText}>Sistólica</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, {
              backgroundColor: '#2196F3' 
            }]} />
            <Text style={styles.legendText}>Diastólica</Text>
          </View>
        </View>
        
        {filteredPoints.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                Máxima {showDiastolic ? 'Diastólica' : 'Sistólica'}
              </Text>
              <View style={styles.statValueContainer}>
                <Text style={[styles.statValue, styles.highValue]}>
                  {showDiastolic 
                    ? maxDiastolicPoint?.diastolic.toFixed(0) ?? '--'
                    : maxSystolicPoint?.systolic.toFixed(0) ?? '--'}
                </Text>
                <PressureIndicator 
                  systolic={showDiastolic ? maxDiastolicPoint?.systolic : maxSystolicPoint?.systolic} 
                  diastolic={showDiastolic ? maxDiastolicPoint?.diastolic : maxSystolicPoint?.diastolic} 
                />
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Media</Text>
              <View style={styles.statValueContainer}>
                <Text style={styles.statValue}>
                  {filteredPoints.length > 0 
                    ? `${Math.round(filteredPoints.reduce((sum, p) => sum + p.systolic, 0) / filteredPoints.length)}/${Math.round(filteredPoints.reduce((sum, p) => sum + p.diastolic, 0) / filteredPoints.length)}` 
                    : ' -- / -- '}
                </Text>
                <PressureIndicator 
                  systolic={filteredPoints.length > 0 ? 
                    filteredPoints.reduce((sum, p) => sum + p.systolic, 0) / filteredPoints.length : 
                    null} 
                  diastolic={filteredPoints.length > 0 ? 
                    filteredPoints.reduce((sum, p) => sum + p.diastolic, 0) / filteredPoints.length : 
                    null} 
                />
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                Mínima {showDiastolic ? 'Diastólica' : 'Sistólica'}
              </Text>
              <View style={styles.statValueContainer}>
                <Text style={[styles.statValue, styles.lowValue]}>
                  {showDiastolic 
                    ? minDiastolicPoint?.diastolic.toFixed(0) ?? '--'
                    : minSystolicPoint?.systolic.toFixed(0) ?? '--'}
                </Text>
                <PressureIndicator 
                  systolic={showDiastolic ? minDiastolicPoint?.systolic : minSystolicPoint?.systolic} 
                  diastolic={showDiastolic ? minDiastolicPoint?.diastolic : minSystolicPoint?.diastolic} 
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#30a99e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
  },
  rangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: '#30a99e',
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  rangeButtonTextActive: {
    color: '#fff',
  },
  toggleButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleButtonSystolic: {
    backgroundColor: '#30a99e',
  },
  toggleButtonDiastolic: {
    backgroundColor: '#30a99e',
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  graphContainer: {
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGraph: {
    padding: 20,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  graph: {
    width: '100%',
    height: '100%',
  },
  secondaryGraph: {
    position: 'absolute',
    opacity: 0.7,
  },
  axisLabel: {
    position: 'absolute',
    backgroundColor: 'gray',
    padding: 6,
    borderRadius: 6,
  },
  topLabel: {
    top: 10,
  },
  bottomLabel: {
    bottom: 10,
  },
  axisLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicatorPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#30a99e',
    marginLeft: 6,
  },
  selectionIndicatorValue: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#30a99e',
    marginRight: 4,
  },
  pressureIndicator: {
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: 'black',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: 'gray',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highValue: {
    color: '#E53935',
  },
  lowValue: {
    color: '#1E88E5',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#30a99e',
  },
});

export default DataGraph;