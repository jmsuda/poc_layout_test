require 'selenium-webdriver'
require 'eyes_selenium'

  if ENV['BROWSER'] == 'firefox'
    caps = Selenium::WebDriver::Remote::Capabilities.firefox
    caps.version = "30"
    caps.platform = "Windows 8"
    caps[:name] = 'Testing Selenium 2 with Ruby on Sauce - Firefox'
  end

  if ENV['BROWSER'] == 'chrome'
    caps = Selenium::WebDriver::Remote::Capabilities.chrome
    caps.version = '26'
    caps.platform = "Windows 8"
    caps[:name] = "Testing Selenium 2 with Ruby on Sauce - Chrome"
  end

  if ENV['BROWSER'] == 'IE9'  
    caps = Selenium::WebDriver::Remote::Capabilities.internet_explorer
    caps.version = "9"
    caps.platform = "Windows 7"
    caps[:name] = "Testing Selenium 2 with Ruby on Sauce - IE8"
  end
  caps["screen-resolution"] = "1280x1024"


  @my_webdriver = Selenium::WebDriver.for(
    :remote,
    url: "http://#{ENV['SAUCE_USERNAME']}:#{ENV['SAUCE_ACCESS_KEY']}@ondemand.saucelabs.com:80/wd/hub",
    :desired_capabilities => caps)
  
  begin

    eyes = Applitools::Eyes.new
    # This is your api key, make sure you use it in all your tests.
    eyes.api_key = ENV['APPLITOOLS_KEY']

	  eyes.test(app_name: 'Applitools', test_name: 'hope_test', viewport_size: {width: 1024, height: 768}, driver: @my_webdriver) do |driver|
	  driver.get 'http://www.hopelingerie.com.br/logincadastro.aspx'
	  driver.find_element(:id, "txtEmail").send_keys("seuemail@teste.com.br")
	  driver.find_element(:id, "txtSenha").send_keys("suasenha")
	  driver.find_element(:id, "enter").click 
    driver.find_element(:id, "fancybox-close").click
    driver.get 'http://www.hopelingerie.com.br'
    
    eyes.check_window('Home')
  end

 ensure
     @my_webdriver.quit
end

