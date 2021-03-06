import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import requestService from '../services/request';
import Cookies from 'js-cookie';

import Logo from '../components/Logo';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

export default class LoginPage extends Component {
  constructor(props){
    super(props);
    this.state = {
      //Usado durante o render para redirecionar pra página de feed ou não:
      sessionActive: false,
      //Mensagem a ser exibida, se houver
      message: '',
      //Tipo de mensagem a ser exibida, se houver
      messageType: '',
      //Renderiza o form de signup ao invés do form de login
      showSignupForm: false
    }
    //Faz o bind das funções do component:
    this.doLogin = this.doLogin.bind(this);
    this.doSignup = this.doSignup.bind(this);
    this.renderMessage = this.renderMessage.bind(this);
    this.renderFormFooter = this.renderFormFooter.bind(this);
    this.showLogin = this.showLogin.bind(this);
    this.showSignup = this.showSignup.bind(this);
    this.renderForm = this.renderForm.bind(this);
  }

  /**
   * Quando a view for montada, verifica se ja não existe uma session válida e ativa.
   */
  async componentDidMount() {
    let token = Cookies.get('token');
    const session = await requestService.validateSession(token);
    if(session.active){
      //Seta a variável que vai renderizar um <Redirect> pra mudar de página:
      this.setState({ sessionActive: true });
    }
  }

  /**
   * Faz a request no servidor para realizar o login.
   * @param {email: String, password: String} loginForm Form com os dados de login
   */
  async doLogin(loginForm) {
    const login = await requestService.login(loginForm.email, loginForm.password);
    if(login.success){
      Cookies.set('token', login.token);    //Seta o token nos cookies
      Cookies.set('userId', login.userId);  //Seta o userId nos cookies
      //Seta a variável que vai renderizar um <Redirect> pra mudar de página:
      this.setState({ sessionActive: true })
    }
    //Em caso de erro, renderiza a mensagem do servidor:
    else{   
      this.setState({ message: login.message, messageType: "warning" });
    }
  }

  /**
   * Faz a request no servidor para criar uma nova conta.
   * @param {
   *  email: String,
   *  nickname: String,
   *  password: String,
   *  passwordAgain: String
   * } signupForm Form com os dados do usuário
   */
  async doSignup(signupForm) {
    const signup = await requestService.signup(signupForm);
    if(signup.success){
      this.showLogin();   //Exibe o form de login novamente
      //Exibe uma mensagem de conta criada com sucesso:
      this.setState({ 
        message: "Account successfuly created. You may now login.", 
        messageType: "success" 
      });
    }
    //Em caso de erro, renderiza a mensagem do servidor:
    else{ 
      this.setState({ message: signup.message, messageType: "warning" });
    }
  }

  /**
   * Renderiza a mensagem de alerta em caso de erro ou sucesso em uma request
   * de acordo com o que está setado no state.
   */
  renderMessage() {
    if(this.state.message.length){
      return (
        <Alert variant={this.state.messageType} className="mb-0">
          {this.state.message}
        </Alert>
      )
    }
    else{
      return <Alert variant="link" className="mb-0 color-transparent">.</Alert>;
    }
  }

  /**
   * [comando] Faz exibir o form de Sign up.
   */
  showSignup() {
    this.setState({ showSignupForm: true, message: '' });
  }

  /**
   * [comando] Faz exibir o form de Login.
   */
  showLogin() {
    this.setState({ showSignupForm: false, message: '' });
  }

  renderForm() {
    return this.state.showSignupForm ? 
      <SignupForm doSignup={this.doSignup} /> 
      : 
      <LoginForm doLogin={this.doLogin} />
  }

  /**
   * Renderiza o footer do form.
   */
  renderFormFooter() {
    {/* Botão que alterna entre 'Login' e 'Signup' */}
    const actionButton = this.state.showSignupForm ?
      <Button variant="link" block onClick={this.showLogin}>
        Login
      </Button>
      :
      <Button variant="link" block onClick={this.showSignup}>
        Sign up
      </Button>
      
    return (
      <Row className="justify-content-md-between">
        <Col sm="auto" className="justify-content-center">
          <Button variant="link" block>Privacy Policy</Button>
        </Col>
        <Col sm="auto" className="justify-content-center">
          { actionButton }
        </Col>
      </Row>
    )
  }

  render(){
    return this.state.sessionActive ?
      <Redirect to="/feed" />
      :
      <React.Fragment>
        <div className="my-login-background"></div>
        <Container className="my-login-container">
            <Row className="align-items-center my-full-height">
            <Col md="6" lg="7" className="my-login-phrase d-none d-lg-block">
              Get in touch with your interests, while sharing your thoughts with the world.
            </Col>
            <Col md="6" lg="4" xl="3" className="my-login-box pt-4 pb-3">
              <Logo />
              { this.renderForm() }
              { this.renderFormFooter() }
              { this.renderMessage() }
            </Col>
          </Row>
        </Container>
      </React.Fragment>
  }
}