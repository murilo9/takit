import React from 'react';
import { connect } from 'react-redux';
import { mapDispatchToProps, mapStateToProps } from '../pages/base';

import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import ProfilePicture from './ProfilePicture.js';
import ThemeSwitch from './ThemeSwitch.js';
import Notification from './Notification.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faArrowLeft,
  faBell
} from '@fortawesome/free-solid-svg-icons';

import request from '../services/request.js';
import { getImgUrl } from '../services/firebase.js';

class Topbar extends React.Component {
  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
    this.state = {
      showMobileSearch: false,
      notifications: [],
      notificationsLoaded: false,
      userPictureUrl: ''    //Carregado no componentDidMount()
    }
    this.toggleMobileSearch = this.toggleMobileSearch.bind(this);
    this.renderMobileSearchReturnButton = this.renderMobileSearchReturnButton.bind(this);
    this.toggleDarkTheme = this.toggleDarkTheme.bind(this);
    this.loadNotifications = this.loadNotifications.bind(this);
    this.renderNotifications = this.renderNotifications.bind(this);
  }

  async componentDidMount(){
    let userPictureUrl = await getImgUrl(this.props.session.userId, 
      this.props.user.profilePicture);
    this.setState({
      userPictureUrl
    })
    
  }

  logout() {
    this.props.logout();
  }

  toggleMobileSearch() {
    this.setState({ showMobileSearch: !this.state.showMobileSearch });
  }

  toggleDarkTheme(){
    this.props.toggleDarkTheme();
  }

  async loadNotifications(){
    if(!this.state.notificationsLoaded){
      const req = await request.getNotifications();
      let notifications = [];
      if(req.success){
        notifications = req.data;
        this.setState({
          notifications,
          notificationsLoaded: true
        })
      }
      else{
        //TODO - Tratamento de erro ao carregar as notificações
      }
    }
  }

  renderMobileSearchReturnButton() {
    return this.state.showMobileSearch ?
      <Form.Group controlId="formBasicReturn" className="my-return-button">
        <Button variant="dark" onClick={this.toggleMobileSearch}>
          <FontAwesomeIcon icon={faArrowLeft} className="my-profile-data-icon" />
        </Button>
      </Form.Group>
      : null
  }

  renderNotifications(){
    if(this.state.notificationsLoaded){
      if(this.state.notifications.length){
        let notifications = [];
        this.state.notifications.forEach(notification => {
          notifications.push(
            <Notification data={notification} key={notification._id} />
          )
        })
        notifications.push(
          <NavDropdown.Item href='/notifications' 
          className="d-flex align-center w-100 text-primary my-see-all">
            <span>See all</span>
          </NavDropdown.Item>
        )
        return notifications;
      }
      else{
        return <p className="my-notification-label text-center mb-0">
          No notifications to show.
        </p>
      }
    }
    else{
      return <div className="my-notification-label d-flex justify-content-center align-middle">
        <Spinner animation="border" role="status"></Spinner>
        <span className="ml-2">Loading...</span>
      </div>
    }
  }

  render() {
    return (
      <Navbar bg="dark" variant="dark" expand="md" fixed="top" className="my-navbar-container">
        <Container>
          {
            this.state.showMobileSearch ? null :
              <Navbar.Brand href="/feed">Mydria</Navbar.Brand>
          }
          <Form inline className={this.state.showMobileSearch ?
            "my-mobile-search" : "d-none d-sm-flex"} action="/feed">
            {this.renderMobileSearchReturnButton()}
            <Form.Group controlId="formBasicInput" className="my-search-input">
              <Form.Control type="text"
                name="search"
                placeholder="Search"
                onKeyDown={this.handleKeyDown}
              />
            </Form.Group>
            <Form.Group controlId="formBasicSearch" className="d-none d-sm-inline">
              <Button variant="dark" type="submit">
                <FontAwesomeIcon icon={faSearch} className="my-profile-data-icon" />
              </Button>
            </Form.Group>
          </Form>
          <Nav className={
            this.state.showMobileSearch ? "d-none" : "flex-row ml-auto my-navbar"
          }>
            <Nav.Link href="" onClick={this.toggleMobileSearch} 
            className="d-block d-sm-none mr-3">
              <FontAwesomeIcon icon={faSearch} className="my-profile-data-icon" />
            </Nav.Link>
            <ThemeSwitch toggleDarkTheme={this.toggleDarkTheme} />
            <NavDropdown className="d-none d-sm-flex align-itens-middle my-notifications mr-2" alignRight
            title={ <FontAwesomeIcon icon={faBell} /> } onClick={this.loadNotifications}>
              { this.renderNotifications() }
            </NavDropdown>
            <ProfilePicture nickname={this.props.user.nickname} noMargin
              url={this.state.userPictureUrl} size="tiny" tabletDesktopOnly/>
            <NavDropdown title={this.props.user.nickname}
              alignRight id="basic-nav-dropdown">
              <NavDropdown.Item href="/notifications" className="d-sm-none">Notifications</NavDropdown.Item>
              <NavDropdown.Item href="/follows">People you follow</NavDropdown.Item>
              <NavDropdown.Item href={"/profile/" + this.props.user.nickname}>Profile</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={this.logout}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Container>
      </Navbar>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Topbar);