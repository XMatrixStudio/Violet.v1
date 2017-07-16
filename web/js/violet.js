function sendNotice(str) {
  $('#noticeDiv').html('<div id="noticeBox" class="float_div alert alert-warning alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p id="noticeText"></p></div>');
  $('#noticeText').html(str);
  $('#noticeBox').fadeIn(300);
}

function cleanNotice() {
  $('#noticeBox').fadeOut(100);
}

function setTime() { //设置按钮倒计时
  if (countdown < 0) {
    document.getElementById('gCode').removeAttribute('disabled');
    document.getElementById('gCode').innerHTML = '获取验证码';
    countdown = 120;
  } else {
    document.getElementById('gCode').setAttribute('disabled', true);
    document.getElementById('gCode').innerHTML = '重新发送(' + countdown + ')';
    countdown--;
    setTimeout(setTime, 1000);
  }
}

function setTimeE() { //设置按钮倒计时
  if (countdownE < 0) {
    document.getElementById('gCodeE').removeAttribute('disabled');
    document.getElementById('gCodeE').innerHTML = '获取验证码';
    countdownE = 120;
  } else {
    document.getElementById('gCodeE').setAttribute('disabled', true);
    document.getElementById('gCodeE').innerHTML = '重新发送(' + countdownE + ')';
    countdownE--;
    setTimeout(setTimeE, 1000);
  }
}


function getCookie(name) { //获取cookie
  var arr, reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
  return (arr = document.cookie.match(reg)) ? unescape(arr[2]) : null;
}

function getQueryString(name) { //获取get参数
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  var r = window.location.search.substr(1).match(reg);
  return r !== null ? unescape(r[2]) : null;
}

function regularTest(pattern, id, send) { //正则匹配
  if (!pattern.test(document.getElementById(id).value)) {
    sendNotice(send);
    $('#' + id).focus();
    $('#' + id).val('');
    return 0;
  } else {
    return 1;
  }
}

function isNullTest(id, send) { //非空检测
  if (document.getElementById(id).value === '') {
    sendNotice(send);
    $('#' + id).focus();
    return 1;
  } else {
    return 0;
  }
}

let formErr = (str, id) => {
  sendNotice(str);
  $('#' + id).val('');
  $('#' + id).focus();
};

function logout() {
  $.post('/api/logout', {}, (data) => {
    window.location.href = '/index.html';
  });
}