/**
 * @component DatePicker
 * @import {DatePicker} from '../components/ui'
 * @description Cross-platform date/time picker with @react-native-community/datetimepicker API
 * 
 * @props
 * value: Date (current selected date/time)
 * onChange: (event, selectedDate?) => void (callback with event and new date)
 * mode: 'date'|'time'|'datetime' (default: 'date')
 * display: 'default'|'spinner'|'calendar'|'clock' (default: 'default')
 * minimumDate?: Date (earliest selectable date)
 * maximumDate?: Date (latest selectable date)
 * disabled?: boolean (default: false)
 * style?: ViewStyle
 * className?: string
 * 
 * @examples
 * <DatePicker value={date} onChange={(e, newDate) => setDate(newDate)} />
 * <DatePicker value={date} onChange={handleChange} mode="time" />
 * <DatePicker value={date} onChange={handleChange} minimumDate={new Date()} />
 * <DatePicker value={date} onChange={handleChange} disabled={loading} />
 * 
 * @theme-usage
 * Uses inputBackground (button), border (outlines), text/textMuted (labels),
 * cardBackground (modal), primary/primaryForeground (selections), borderLight (toggles)
 * 
 * @important
 * - Modal opens on button press, disabled state prevents opening
 * - Date mode: calendar grid with month navigation
 * - Time mode: hour/minute spinners + AM/PM toggle
 * - Event object: { type: 'set'|'dismissed', nativeEvent: { timestamp } }
 * - Respects min/max dates by disabling invalid dates
 * - 12-hour time format with AM/PM toggle
 * - Responsive modal width (90% max 350px)
 * - Today/selected dates get special styling
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

// DatePicker interface matching @react-native-community/datetimepicker
interface DatePickerProps {
  value: Date;
  onChange: (event: any, selectedDate?: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  className?: string;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  mode = 'date',
  display = 'default',
  minimumDate,
  maximumDate,
  disabled = false,
  className,
  style,
}) => {
  const { inputBackground, border, text, textMuted, cardBackground, primary, primaryForeground, borderLight } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
  const [isAM, setIsAM] = useState(value.getHours() < 12);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDate = (date: Date): string => {
    if (mode === 'time') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const isDateDisabled = (date: Date) => {
    if (maximumDate && date > maximumDate) return true;
    if (minimumDate && date < minimumDate) return true;
    return false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === value.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const handleDateSelect = (selectedDate: Date) => {
    const event = { type: 'set', nativeEvent: { timestamp: selectedDate.getTime() } };
    onChange(event, selectedDate);
    setShowModal(false);
  };

  const handleTimeSelect = () => {
    const newDate = new Date(value);
    const hour24 = isAM ? selectedHour : selectedHour + 12;
    newDate.setHours(hour24, selectedMinute);

    const event = { type: 'set', nativeEvent: { timestamp: newDate.getTime() } };
    onChange(event, newDate);
    setShowModal(false);
  };

  const formatTime12Hour = (hour: number) => {
    if (hour === 0) return 12;
    if (hour > 12) return hour - 12;
    return hour;
  };

  const handleCancel = () => {
    const event = { type: 'dismissed' };
    onChange(event);
    setShowModal(false);
  };

  const handlePress = () => {
    if (disabled) return;
    setCurrentMonth(value.getMonth());
    setCurrentYear(value.getFullYear());
    setSelectedHour(formatTime12Hour(value.getHours()));
    setSelectedMinute(value.getMinutes());
    setIsAM(value.getHours() < 12);
    setShowModal(true);
  };

  return (
    <View style={[{ alignSelf: 'stretch' }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: inputBackground,
          borderWidth: 1,
          borderColor: border,
          borderRadius: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: 40,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Calendar size={20} color={textMuted} style={{ marginRight: 8 }} />
        <Text style={{
          fontSize: 14,
          color: text,
          flex: 1,
        }}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            width: '90%',
            maxWidth: 350,
            backgroundColor: cardBackground,
            borderRadius: 12,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: border,
              marginBottom: 16,
            }}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={{ fontSize: 16, color: textMuted }}>Cancel</Text>
              </TouchableOpacity>
              
              <Text style={{ fontSize: 18, fontWeight: '600', color: text }}>
                {mode === 'time' ? 'Select Time' : 'Select Date'}
              </Text>
              
              <TouchableOpacity onPress={mode === 'time' ? handleTimeSelect : () => handleDateSelect(value)}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: primary }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Month Navigation - Only for date mode */}
            {mode === 'date' && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <TouchableOpacity
                  onPress={() => navigateMonth('prev')}
                  style={{ padding: 8 }}
                >
                  <ChevronLeft size={24} color={text} />
                </TouchableOpacity>

                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: text,
                  textAlign: 'center',
                  flex: 1,
                }}>
                  {monthNames[currentMonth]} {currentYear}
                </Text>

                <TouchableOpacity
                  onPress={() => navigateMonth('next')}
                  style={{ padding: 8 }}
                >
                  <ChevronRight size={24} color={text} />
                </TouchableOpacity>
              </View>
            )}

            {/* Date Picker */}
            {mode === 'date' && (
              <>
                {/* Day Headers */}
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {dayNames.map((day) => (
                    <Text key={day} style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: '600',
                      color: textMuted,
                      paddingVertical: 8,
                    }}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {generateCalendarDays(currentYear, currentMonth).map((date, index) => {
                    const disabled = isDateDisabled(date);
                    const selected = isSelected(date);
                    const today = isToday(date);
                    const currentMonthDate = isCurrentMonth(date);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={{
                          width: '14.28%',
                          aspectRatio: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 4,
                          margin: 1,
                          backgroundColor: selected
                            ? primary
                            : today
                            ? borderLight
                            : 'transparent',
                          opacity: disabled ? 0.3 : currentMonthDate ? 1 : 0.4,
                        }}
                        onPress={() => !disabled && handleDateSelect(date)}
                        disabled={disabled}
                      >
                        <Text style={{
                          fontSize: 16,
                          textAlign: 'center',
                          color: selected
                            ? primaryForeground
                            : today
                            ? primary
                            : text,
                          fontWeight: selected || today ? '600' : '400'
                        }}>
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Time Picker */}
            {mode === 'time' && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  {/* Hour Picker */}
                  <View style={{ alignItems: 'center', marginRight: 20 }}>
                    <Text style={{ fontSize: 14, color: textMuted, marginBottom: 8 }}>Hour</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => setSelectedHour(selectedHour > 1 ? selectedHour - 1 : 12)}
                        style={{ padding: 8 }}
                      >
                        <Text style={{ fontSize: 20, color: primary }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{
                        fontSize: 24,
                        fontWeight: '600',
                        minWidth: 40,
                        textAlign: 'center',
                        marginHorizontal: 16,
                        color: text
                      }}>
                        {selectedHour.toString().padStart(2, '0')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedHour(selectedHour < 12 ? selectedHour + 1 : 1)}
                        style={{ padding: 8 }}
                      >
                        <Text style={{ fontSize: 20, color: primary }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={{ fontSize: 24, fontWeight: '600', marginHorizontal: 8, color: text }}>:</Text>

                  {/* Minute Picker */}
                  <View style={{ alignItems: 'center', marginLeft: 20 }}>
                    <Text style={{ fontSize: 14, color: textMuted, marginBottom: 8 }}>Minute</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => setSelectedMinute(selectedMinute > 0 ? selectedMinute - 1 : 59)}
                        style={{ padding: 8 }}
                      >
                        <Text style={{ fontSize: 20, color: primary }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{
                        fontSize: 24,
                        fontWeight: '600',
                        minWidth: 40,
                        textAlign: 'center',
                        marginHorizontal: 16,
                        color: text
                      }}>
                        {selectedMinute.toString().padStart(2, '0')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedMinute(selectedMinute < 59 ? selectedMinute + 1 : 0)}
                        style={{ padding: 8 }}
                      >
                        <Text style={{ fontSize: 20, color: primary }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* AM/PM Toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: borderLight, borderRadius: 8, padding: 4 }}>
                  <TouchableOpacity
                    onPress={() => setIsAM(true)}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 6,
                      backgroundColor: isAM ? primary : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: isAM ? primaryForeground : textMuted,
                      fontWeight: '600'
                    }}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsAM(false)}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 6,
                      backgroundColor: !isAM ? primary : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: !isAM ? primaryForeground : textMuted,
                      fontWeight: '600'
                    }}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
