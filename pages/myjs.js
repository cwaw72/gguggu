//메뉴창
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#menu-sidebar-wrapper").toggleClass("active");
});

$("#menu-close").click(function(e) {
  e.preventDefault();
  $("#menu-sidebar-wrapper").toggleClass("active");
});

//로그인 후 채팅 창
$("#login-menu-close").click(function(e) {
  e.preventDefault();
  $("#login-sidebar-wrapper").toggleClass("active");
});
$("#login-menu-toggle").click(function(e) {
  e.preventDefault();
  $("#login-sidebar-wrapper").toggleClass("active");
});

//데이트 픽!
$('#sandbox-container input').datepicker({
});
