/**
 * @component ModalWrapper
 * @import {ModalWrapper} from '../components/ui'
 * @description Modal wrapper that properly handles safe areas on devices with notches
 * 
 * @props
 * visible: boolean
 * onClose: () => void
 * children: React.ReactNode
 * animationType?: 'none' | 'slide' | 'fade' (default: 'slide')
 */

import React from 'react';
import { Modal, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  style?: ViewStyle;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  visible,
  onClose,
  children,
  animationType = 'slide',
  style,
}) => {
  const { background } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={true}
      onRequestClose={onClose}
    >
      <View 
        style={[{
          flex: 1,
          backgroundColor: background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }, style]}
      >
        {children}
      </View>
    </Modal>
  );
};