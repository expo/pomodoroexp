import React from 'react';
import {
  Animated,
  StyleSheet,
  Platform,
  TouchableNativeFeedback,
  Image,
  Text,
  View,
} from 'react-native';

import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

export default class Button extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      scale: new Animated.Value(0),
    }
  }

  componentDidMount() {
    requestAnimationFrame(() => {
      Animated.spring(this.state.scale, {toValue: 1}).start();
    });
  }

  render() {
    let { scale } = this.state;
    let buttonProps = {};
    let TouchableComponent;

    if (Platform.OS === 'ios') {
      TouchableComponent = TouchableBounce;
    } else {
      TouchableComponent = TouchableNativeFeedback;
      buttonProps = {
        background: TouchableNativeFeedback.Ripple('#fff', false),
      };
    }

    return (
      <Animated.View style={{opacity: scale, transform: [{scale}]}}>
        <TouchableComponent onPress={this.props.onPress} {...buttonProps}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>
              {this.props.children}
            </Text>
          </View>
        </TouchableComponent>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    paddingTop: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  button: {
    backgroundColor: '#4C4747',
    borderRadius: 3,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginHorizontal: 10,
  },
  buttonText: {
    fontWeight: '200',
    color: '#fff',
    fontSize: 25,
  },
});
