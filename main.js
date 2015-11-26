'use strict';

import React, {
  Animated,
  AppRegistry,
  ScrollView,
  Navigator,
  StyleSheet,
  Platform,
  TouchableNativeFeedback,
  Text,
  View,
} from 'react-native';

import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';
import DrawerLayout from 'react-native-drawer-layout';

class PomodoroApp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {
    return (
      <View style={styles.container}>
        <DrawerLayout
          drawerWidth={300}
          renderNavigationView={this._renderMenu.bind(this)}>
          <Navigator
            initialRoute={{id: 'home'}}
            renderScene={this._renderScene} />
        </DrawerLayout>
      </View>
    );
  }

  _renderMenu() {
    return (
      <View style={{backgroundColor: '#fff', flex: 1}} />
    )
  }

  _renderScene(route, navigator) {
    if (route.id === 'home') {
      return <MainScreen navigator={navigator} />;
    } else if (route.id === 'settings') {
      return <SettingsScreen navigator={navigator} />;
    }
  }
}

function pad(num, size) {
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}

// const POMODORO = 20 * 60;
// const BREAK = 5 * 60;
const POMODORO_DURATION = 10;
const BREAK_DURATION = 5;

class MainScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      backgroundColor: new Animated.Value(0),
      totalTimeRemaining: POMODORO_DURATION,
      countdownState: 'idle',
    };
  }

  render() {
    let { currentScreen } = this.state;
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['#000', '#CA4343', '#3268A6'],
    });

    return (
      <Animated.View style={[styles.container, {backgroundColor}]}>
        <View style={styles.contentContainer}>
          {this._renderTimeRemaining()}
        </View>
        {this._renderButtons()}
      </Animated.View>
    );
  }

  _renderTimeRemaining() {
    let { totalTimeRemaining } = this.state;
    let minutesRemaining = parseInt((totalTimeRemaining / 60), 10);
    let secondsRemaining = totalTimeRemaining - minutesRemaining * 60;

    return (
      <Text style={styles.countdown}>
        {`${pad(minutesRemaining, 2)}:${pad(secondsRemaining, 2)}`}
      </Text>
    );
  }

  _renderButtons() {
    let { countdownState } = this.state;

    if (countdownState === 'idle') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._startTimer() }}>
            Start
          </Button>
        </View>
      );
    } else if (countdownState === 'active') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._pauseTimer() }}>
            Pause
          </Button>
          <Button onPress={() => { this._stopTimer() }}>
            Stop
          </Button>
        </View>
      );
    } else if (countdownState === 'paused') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._startTimer() }}>
            Start
          </Button>
          <Button onPress={() => { this._stopTimer() }}>
            Stop
          </Button>
        </View>
      );
    } else if (countdownState === 'break') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._startTimer() }}>
            Skip break
          </Button>
        </View>
      );
    }
  }

  _pauseTimer() {
    this.setState({countdownState: 'paused'}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 0.5}).start();
      clearInterval(this._timer);
      this._timer = null;
    });
  }

  _stopTimer() {
    this.setState({countdownState: 'idle', totalTimeRemaining: POMODORO_DURATION}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 0}).start();
      clearInterval(this._timer);
      this._timer = null;
    });
  }

  _startTimer() {
    clearInterval(this._timer);

    this.setState({countdownState: 'active', totalTimeRemaining: POMODORO_DURATION}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 1}).start();
      this._timer = setInterval(() => {
        if (this.state.totalTimeRemaining === 0) {
          this._startBreak();
        } else {
          this.setState({totalTimeRemaining: this.state.totalTimeRemaining - 1});
        }
      }, 1000);
    });
  }

  _startBreak() {
    clearInterval(this._timer);

    this.setState({countdownState: 'break', totalTimeRemaining: BREAK_DURATION}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 2}).start();
      this._timer = setInterval(() => {
        if (this.state.totalTimeRemaining === 0) {
          this._startTimer();
        } else {
          this.setState({totalTimeRemaining: this.state.totalTimeRemaining - 1});
        }
      }, 1000);
    });
  }
}

class Button extends React.Component {
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

class SettingsScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View />
    );
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    paddingTop: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  button: {
    backgroundColor: '#4C4747',
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginHorizontal: 10,
  },
  buttonText: {
    fontWeight: '200',
    color: '#fff',
    fontSize: 25,
  },
  countdown: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 70,
  },
  subtitle: {
    color: '#fff',
    opacity: 0.75,
    fontSize: 25,
  }
});

AppRegistry.registerComponent('main', () => PomodoroApp);
