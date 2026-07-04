package handlers

import (
	"net/http"

	"github.com/a912454361/gopen/internal/auth"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	authService *auth.Service
}

func NewUserHandler(authService *auth.Service) *UserHandler {
	return &UserHandler{authService: authService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetInt64("userID")

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": userToResponse(user)})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetInt64("userID")

	type UpdateRequest struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Avatar   string `json:"avatar"`
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = userID
	_ = req

	c.JSON(http.StatusOK, gin.H{"message": "profile update not implemented yet"})
}
