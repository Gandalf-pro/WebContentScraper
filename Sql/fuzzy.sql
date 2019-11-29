select * from "Movies"
where title % 'spiderman';



--auto complete example
select * from "Movies"
--where title % 'Batman';
where lower(title) like '%bat%'