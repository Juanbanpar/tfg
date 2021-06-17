INSERT INTO users(
	name, lastname1, lastname2, current_privilege, idcard, password)
	VALUES ('Juan', 'Banga', 'Pardo', 'admin', '5C1AB42E', crypt('juan', gen_salt('bf')));
	
INSERT INTO users(
	name, lastname1, current_privilege, idcard, password)
	VALUES ('John', 'Doe', 'user', '6588BA2C', crypt('john', gen_salt('bf')));
	
INSERT INTO logs(
	accesstime, user_fk)
	VALUES (now(), '1');
	
INSERT INTO logs(
	accesstime, user_fk)
	VALUES (now(), '2');
