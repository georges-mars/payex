/**
 * @component MagicallyAlert
 * @import {MagicallyAlert} from '../components/ui'
 * @description Cross-platform alert system with React Native Alert API compatibility
 * 
 * @props
 * title: string (alert title)
 * message?: string (optional description)
 * buttons?: AlertButton[] (array of button configs)
 * options?: AlertOptions (cancelable, onDismiss)
 * 
 * AlertButton: { text?: string, onPress?: () => void, style?: 'default'|'cancel'|'destructive' }
 * AlertOptions: { cancelable?: boolean, onDismiss?: () => void }
 * 
 * @examples
 * MagicallyAlert.alert('Success', 'Operation completed');
 * MagicallyAlert.alert('Confirm', 'Are you sure?', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'Delete', style: 'destructive', onPress: () => deleteItem() }
 * ]);
 * MagicallyAlert.alert('Title', 'Message', [], { cancelable: false });
 * 
 * @theme-usage
 * Uses cardBackground (modal), text (title), textMuted (message/cancel), 
 * primary (default buttons), error (destructive), border (separators)
 * 
 * @important
 * - Must render AlertComponent in App.tsx root
 * - Global singleton pattern like React Native Alert
 * - Backdrop dismissible unless cancelable: false
 * - Buttons auto-layout: ≤2 horizontal, >2 vertical
 * - 100ms delay between close and onPress for smooth animation
 * - Responsive width (max 320px, min 32px margins)
 * - onDismiss called on backdrop press if cancelable
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Alert button interface matching React Native Alert
interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Alert options interface
interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

// Alert state interface
interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options: AlertOptions;
}

// Global alert state
let globalAlertState: AlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
  options: {}
};

let setGlobalAlert: React.Dispatch<React.SetStateAction<AlertState>> | null = null;

// Alert component
const AlertComponent: React.FC = () => {
  const { cardBackground, text, textMuted, border, borderRadius, destructive, primary } = useTheme();
  const [alertState, setAlertState] = useState<AlertState>(globalAlertState);

  useEffect(() => {
    setGlobalAlert = setAlertState;
    return () => {
      setGlobalAlert = null;
    };
  }, []);

  const handleButtonPress = (button: AlertButton) => {
    // Hide alert first
    setAlertState(prev => ({ ...prev, visible: false }));
    
    // Then call the button's onPress after a small delay to allow animation
    setTimeout(() => {
      button.onPress?.();
    }, 100);
  };

  const handleBackdropPress = () => {
    if (alertState.options.cancelable !== false) {
      setAlertState(prev => ({ ...prev, visible: false }));
      setTimeout(() => {
        alertState.options.onDismiss?.();
      }, 100);
    }
  };

  const getButtonVariant = (style?: string) => {
    switch (style) {
      case 'destructive':
        return 'destructive';
      case 'cancel':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!alertState.visible) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  const alertWidth = Math.min(screenWidth - 32, 320);

  return (
    <Modal
      transparent
      visible={alertState.visible}
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}} // Prevent backdrop press when tapping alert
          style={{
            width: alertWidth,
            backgroundColor: cardBackground,
            borderRadius: borderRadius * 1.5,
            padding: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {/* Content */}
          <View style={{ padding: 20 }}>
            {/* Title */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: text,
                textAlign: 'center',
                marginBottom: alertState.message ? 8 : 0,
              }}
            >
              {alertState.title}
            </Text>

            {/* Message */}
            {alertState.message && (
              <Text
                style={{
                  fontSize: 14,
                  color: textMuted,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {alertState.message}
              </Text>
            )}
          </View>

          {/* Buttons */}
          {alertState.buttons.length > 0 && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: border,
                flexDirection: alertState.buttons.length > 2 ? 'column' : 'row',
              }}
            >
              {alertState.buttons.map((button, index) => (
                <View key={index} style={{ 
                  flex: alertState.buttons.length > 2 ? undefined : 1,
                  width: alertState.buttons.length > 2 ? '100%' : undefined
                }}>
                  <TouchableOpacity
                    onPress={() => handleButtonPress(button)}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      alignItems: 'center',
                      borderRightWidth:
                        alertState.buttons.length === 2 && index === 0 ? 1 : 0,
                      borderRightColor: border,
                      borderBottomWidth:
                        alertState.buttons.length > 2 && index < alertState.buttons.length - 1
                          ? 1
                          : 0,
                      borderBottomColor: border,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: button.style === 'cancel' ? '400' : '600',
                        color:
                          button.style === 'destructive'
                            ? destructive
                            : button.style === 'cancel'
                            ? textMuted
                            : primary,
                      }}
                    >
                      {button.text || 'OK'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// MagicallyAlert API - exact replica of React Native Alert
export const MagicallyAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    const defaultButtons: AlertButton[] = buttons?.length
      ? buttons
      : [{ text: 'OK', style: 'default' }];

    const newState: AlertState = {
      visible: true,
      title,
      message,
      buttons: defaultButtons,
      options: options || {},
    };

    if (setGlobalAlert) {
      setGlobalAlert(newState);
    } else {
      globalAlertState = newState;
    }
  },
};

// Export the component to be rendered in App.tsx
export default AlertComponent;
